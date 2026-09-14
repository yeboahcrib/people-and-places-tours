/* The internal enquiry dashboard.
 *
 * It knows nothing about the database. It asks /api/dashboard for figures that
 * are already counted — narrowed by at most three filters — and draws them.
 * One enquiry's full record is fetched from /api/dashboard/enquiry only when
 * somebody opens it, and shown in a drawer so the figures stay where they were.
 *
 * Charts are drawn from the numbers here rather than by a library: the site's
 * Content-Security-Policy allows scripts from this origin only, and these
 * charts are simple enough not to need one. Every value a chart shows is also
 * written out as text beside it.
 *
 * Nothing from the server is ever inserted as HTML. */
(function () {
  'use strict';

  const root = document.querySelector('[data-dash-root]');
  if (!root) return;
  const scope = document.querySelector('[data-dash-scope]');
  const stamp = document.querySelector('[data-dash-stamp]');
  const form = document.querySelector('[data-dash-filters]');
  const dates = form.querySelector('[data-dash-dates]');
  const clearButton = form.querySelector('[data-dash-clear]');
  const drawer = document.querySelector('[data-dash-drawer]');
  const drawerTitle = drawer.querySelector('[data-drawer-title]');
  const drawerBody = drawer.querySelector('[data-drawer-body]');
  const tip = document.querySelector('[data-dash-tip]');
  const SVG = 'http://www.w3.org/2000/svg';
  const FILTER_KEYS = ['range', 'from', 'to', 'country', 'experience', 'recent'];

  const state = {params: new URLSearchParams(), controller: null, detailToken: 0, trigger: null, redraw: [], focusAfter: null};
  new URLSearchParams(location.search).forEach((value, key) => { if (FILTER_KEYS.includes(key) && value) state.params.set(key, value); });

  /* ── Small builders ───────────────────────────────────────────────── */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function svg(tag, attributes) {
    const node = document.createElementNS(SVG, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  const numberFormat = new Intl.NumberFormat('en-GB');
  const num = value => numberFormat.format(value);
  const plural = (count, one, many) => `${num(count)} ${count === 1 ? one : many}`;
  function share(count, base) {
    if (!base) return '—';
    const value = (count / base) * 100;
    if (count > 0 && value < 1) return '<1%';
    return `${Math.round(value)}%`;
  }
  const dayFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
  const timeFormat = new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit', timeZone: 'UTC'});
  function day(value) {
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00Z` : value);
    return Number.isNaN(date.getTime()) ? String(value || '') : dayFormat.format(date);
  }
  function dayTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value || '') : `${dayFormat.format(date)}, ${timeFormat.format(date)} GMT`;
  }

  /* ── Tooltip: one element, for anything carrying data-tip ─────────── */

  function showTip(target, x, y) {
    tip.textContent = target.getAttribute('data-tip');
    tip.hidden = false;
    const box = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - box.width / 2), window.innerWidth - box.width - 8);
    const top = y - box.height - 12 < 8 ? y + 16 : y - box.height - 12;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }
  document.addEventListener('pointermove', event => {
    const target = event.target.closest && event.target.closest('[data-tip]');
    if (target && root.contains(target)) showTip(target, event.clientX, event.clientY);
    else tip.hidden = true;
  });
  document.addEventListener('scroll', () => { tip.hidden = true; }, {passive: true});

  /* ── Loading ──────────────────────────────────────────────────────── */

  function showMessage(title, detail, action) {
    const box = el('div', 'dash-message');
    box.append(el('h2', null, title), el('p', null, detail));
    if (action) box.append(action);
    root.replaceChildren(box);
    root.setAttribute('aria-busy', 'false');
  }

  function queryString() {
    const query = new URLSearchParams();
    FILTER_KEYS.forEach(key => { const value = state.params.get(key); if (value) query.set(key, value); });
    const text = query.toString();
    return text ? `?${text}` : '';
  }

  function load() {
    if (state.controller) state.controller.abort();
    const controller = new AbortController();
    state.controller = controller;
    root.setAttribute('aria-busy', 'true');
    const query = queryString();
    history.replaceState(null, '', `${location.pathname}${query}`);

    fetch(`/api/dashboard${query}`, {headers: {Accept: 'application/json'}, credentials: 'same-origin', signal: controller.signal})
      .then(response => {
        if (response.status === 401) {
          form.hidden = true;
          scope.textContent = 'Private';
          showMessage('This dashboard is private.', 'Sign in through Cloudflare Access to read it.');
          return null;
        }
        if (!response.ok) {
          showMessage('The figures could not be read.', 'The database did not answer. Try again shortly.');
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (!data || state.controller !== controller) return;
        syncFilters(data);
        render(data);
      })
      .catch(error => {
        if (error && error.name === 'AbortError') return;
        showMessage('The figures could not be read.', 'Check the connection and try again.');
      })
      .finally(() => { if (state.controller === controller) root.setAttribute('aria-busy', 'false'); });
  }

  /* ── Filters ──────────────────────────────────────────────────────── */

  const filtered = applied => applied.range !== 'all' || Boolean(applied.country) || Boolean(applied.experience);

  function fillSelect(select, entries, selected) {
    const options = entries.map(([value, label]) => {
      const option = el('option', null, label);
      option.value = value;
      return option;
    });
    if (selected && !entries.some(([value]) => value === selected)) {
      const option = el('option', null, selected.replace(/^raw:/, ''));
      option.value = selected;
      options.push(option);
    }
    select.replaceChildren(...options);
    select.value = selected || '';
  }

  function syncFilters(data) {
    const applied = data.applied;
    form.hidden = false;
    fillSelect(form.elements.range, data.ranges.map(range => [range.key, range.label]), applied.range);
    dates.hidden = applied.range !== 'custom' && state.params.get('range') !== 'custom';
    form.elements.from.value = applied.range === 'custom' ? applied.from || '' : '';
    form.elements.to.value = applied.range === 'custom' ? applied.to || '' : '';
    fillSelect(form.elements.country, [['', 'All countries'], ...data.options.countries.map(item => [
      item.key, `${item.label}${item.unmatched ? ' (unmatched)' : ''} · ${num(item.count)}`,
    ])], applied.country);
    fillSelect(form.elements.experience, [['', 'All experiences'], ...data.options.experiences.map(item => [
      item.key, `${item.label} · ${num(item.count)}`,
    ])], applied.experience);
    clearButton.hidden = !filtered(applied);
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', event => {
    const {name, value} = event.target;
    if (!FILTER_KEYS.includes(name)) return;
    if (name === 'range') {
      state.params.delete('from');
      state.params.delete('to');
      if (value === 'custom') {
        state.params.set('range', 'custom');
        dates.hidden = false;
        form.elements.from.focus();
        return;
      }
    }
    if (value) state.params.set(name, value); else state.params.delete(name);
    if (name === 'from' || name === 'to') state.params.set('range', 'custom');
    state.params.delete('recent');
    load();
  });
  function clearFilters() {
    state.params = new URLSearchParams();
    dates.hidden = true;
    load();
    form.elements.range.focus();
  }
  clearButton.addEventListener('click', clearFilters);

  function scopeText(data) {
    const {applied, totals} = data;
    scope.replaceChildren();
    if (!filtered(applied)) {
      scope.append('Showing all ', el('strong', null, num(totals.all)), ` ${totals.all === 1 ? 'enquiry' : 'enquiries'}`);
      return;
    }
    const parts = [];
    if (applied.range === 'custom') {
      parts.push(applied.from && applied.to ? `${day(applied.from)} – ${day(applied.to)}` : applied.from ? `From ${day(applied.from)}` : `Until ${day(applied.to)}`);
    } else if (applied.range !== 'all') {
      parts.push((data.ranges.find(range => range.key === applied.range) || {}).label);
    }
    if (applied.countryLabel) parts.push(applied.countryLabel);
    if (applied.experienceLabel) parts.push(applied.experienceLabel);
    scope.append('Showing ', el('strong', null, num(totals.view)), ` of ${num(totals.all)} enquiries · ${parts.join(' · ')}`);
  }

  /* ── Page structure ───────────────────────────────────────────────── */

  let sectionCount = 0;
  function section(title, note, children) {
    sectionCount += 1;
    const node = el('section', 'dash-section');
    const id = `dash-section-${sectionCount}`;
    node.setAttribute('aria-labelledby', id);
    const head = el('div', 'dash-section-head');
    const heading = el('h2', null, title);
    heading.id = id;
    head.append(heading);
    if (note) head.append(el('p', null, note));
    const grid = el('div', 'dash-grid');
    grid.append(...children);
    node.append(head, grid);
    return node;
  }

  function card(title, span, meta) {
    const node = el('article', `card ${span}`);
    const head = el('div', 'card-head');
    head.append(el('h3', null, title));
    if (meta) head.append(el('span', 'card-meta', meta));
    node.append(head);
    return node;
  }

  function keyline(entries) {
    const list = el('ul', 'keyline');
    entries.forEach(([kind, label, count, base]) => {
      const item = el('li');
      item.append(el('span', `swatch is-${kind}`), `${label} `, el('b', null, num(count)));
      if (base !== undefined) item.append(` · ${share(count, base)}`);
      list.append(item);
    });
    return list;
  }

  /* ── Charts ───────────────────────────────────────────────────────── */

  // Rows: {label, count, kind, tag}. Bars share one scale, set by the largest.
  function hbars(rows, base, noun) {
    const list = el('ul', 'hbars');
    const largest = Math.max(1, ...rows.map(row => row.count));
    rows.forEach(row => {
      const item = el('li', `hbar is-${row.kind || 'answer'}`);
      item.setAttribute('data-tip', `${row.label}: ${plural(row.count, noun[0], noun[1])} · ${share(row.count, base)} of ${num(base)}`);
      const label = el('span', 'hbar-label', row.label);
      label.title = row.label;
      if (row.tag) label.append(el('span', 'tag', row.tag));
      const value = el('span', 'hbar-value');
      value.append(el('b', null, num(row.count)), ` · ${share(row.count, base)}`);
      const track = el('span', 'hbar-track');
      const fill = el('span', `hbar-fill${row.count ? '' : ' is-zero'}`);
      fill.style.width = `${(row.count / largest) * 100}%`;
      track.append(fill);
      item.append(label, value, track);
      list.append(item);
    });
    return list;
  }

  // Columns in their own order. A zero is drawn as a flat baseline marked 0:
  // a real answer that nobody gave, not a gap.
  function columns(items, {labelEvery = 1, minWidth = null} = {}) {
    const wrap = el('div', 'cols-scroll');
    const inner = el('div');
    if (minWidth) inner.style.minWidth = minWidth;
    const chart = el('div', 'cols');
    const labels = el('div', 'col-labels');
    labels.setAttribute('aria-hidden', 'true');
    const largest = Math.max(1, ...items.map(item => item.count));
    items.forEach((item, index) => {
      const column = el('div', `col${item.count ? '' : ' is-zero'}`);
      column.setAttribute('data-tip', item.tip);
      const bar = el('span', 'col-bar');
      if (item.count) bar.style.height = `${Math.max(3, (item.count / largest) * 100)}%`;
      if (item.segments) {
        bar.classList.add('is-stacked');
        item.segments.forEach(segment => {
          if (!segment.count) return;
          const piece = el('span', `col-seg is-${segment.kind}`);
          piece.style.flex = `${segment.count} 1 0`;
          bar.append(piece);
        });
      } else if (item.kind) {
        bar.classList.add(`is-${item.kind}`);
      }
      // Beside the bar, not inside it: the figure sits on the card, above the
      // bar's top, and must be read against the card.
      const count = el('span', 'col-count', num(item.count));
      count.style.bottom = item.count ? `calc(${Math.max(3, (item.count / largest) * 100)}% + 4px)` : '6px';
      column.append(bar, count);
      chart.append(column);
      labels.append(el('span', null, index % labelEvery === 0 ? item.short || item.label : ''));
    });
    // A table stretches past any width it is given, so the text alternative is
    // clipped by a wrapper rather than by the table itself.
    const alternative = el('div', 'dash-sr');
    const table = el('table');
    items.forEach(item => {
      const row = el('tr');
      row.append(el('th', null, item.label), el('td', null, item.tip));
      table.append(row);
    });
    alternative.append(table);
    inner.append(chart, labels);
    wrap.append(inner, alternative);
    return wrap;
  }

  const DONUT_COLOURS = ['#123F35', '#C2553D', '#FFB81C'];
  let donutCount = 0;
  function donut(parts, base, noun) {
    donutCount += 1;
    const wrap = el('div', 'donut-wrap');
    const size = 140;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const chart = svg('svg', {class: 'donut', viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: 'img',
      'aria-label': parts.map(part => `${part.label}: ${part.count}`).join('; ')});
    const hatch = `dash-hatch-${donutCount}`;
    const defs = svg('defs');
    const pattern = svg('pattern', {id: hatch, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'});
    pattern.append(svg('rect', {width: 5, height: 5, fill: 'rgba(26,26,26,.08)'}), svg('rect', {width: 2, height: 5, fill: 'rgba(26,26,26,.32)'}));
    defs.append(pattern);
    chart.append(defs, svg('circle', {cx: size / 2, cy: size / 2, r: radius, fill: 'none', stroke: 'rgba(26,26,26,.06)', 'stroke-width': 18}));
    const drawn = parts.filter(part => part.count > 0);
    const gap = drawn.length > 1 ? 2 : 0;
    let offset = 0;
    drawn.forEach(part => {
      const length = (part.count / base) * circumference;
      const arc = svg('circle', {
        cx: size / 2, cy: size / 2, r: radius, fill: 'none', 'stroke-width': 18,
        stroke: part.missing ? `url(#${hatch})` : DONUT_COLOURS[part.colour],
        'stroke-dasharray': `${Math.max(0.5, length - gap)} ${circumference}`,
        'stroke-dashoffset': -offset,
        transform: `rotate(-90 ${size / 2} ${size / 2})`,
      });
      arc.setAttribute('data-tip', `${part.label}: ${plural(part.count, noun[0], noun[1])} · ${share(part.count, base)}`);
      chart.append(arc);
      offset += length;
    });
    const total = svg('text', {x: size / 2, y: size / 2 + 2, 'text-anchor': 'middle', class: 'donut-total'});
    total.textContent = num(base);
    const caption = svg('text', {x: size / 2, y: size / 2 + 19, 'text-anchor': 'middle', class: 'donut-caption'});
    caption.textContent = base === 1 ? 'enquiry' : 'enquiries';
    chart.append(total, caption);

    const legend = el('ul', 'legend');
    parts.forEach(part => {
      const item = el('li');
      const value = el('span', 'legend-value');
      value.append(el('b', null, num(part.count)), ` · ${share(part.count, base)}`);
      item.append(el('span', `swatch ${part.missing ? 'is-missing' : `is-c${part.colour + 1}`}`), el('span', 'legend-label', part.label), value);
      legend.append(item);
    });
    wrap.append(chart, legend);
    return wrap;
  }

  function split(parts, base, noun) {
    const bar = el('div', 'split');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', parts.map(part => `${part.label}: ${part.count}`).join('; '));
    parts.forEach(part => {
      if (!part.count) return;
      const piece = el('span', part.missing ? 'is-missing' : `is-c${part.colour + 1}`);
      piece.style.flex = `${part.count} 1 0`;
      piece.setAttribute('data-tip', `${part.label}: ${plural(part.count, noun[0], noun[1])} · ${share(part.count, base)}`);
      bar.append(piece);
    });
    const legend = el('ul', 'legend');
    parts.forEach(part => {
      const item = el('li');
      const value = el('span', 'legend-value');
      value.append(el('b', null, num(part.count)), ` · ${share(part.count, base)}`);
      item.append(el('span', `swatch ${part.missing ? 'is-missing' : `is-c${part.colour + 1}`}`), el('span', 'legend-label', part.label), value);
      legend.append(item);
    });
    return [bar, legend];
  }

  // Redrawn at its real width on resize: an SVG scaled to fit would shrink
  // its own axis labels past reading on a phone.
  function timelineChart(timeline) {
    const host = el('div', 'timeline');
    const points = timeline.points;
    const unit = timeline.granularity === 'week' ? 'week' : 'month';
    const draw = () => {
      const width = Math.max(240, Math.floor(host.clientWidth || 600));
      // As tall as the card beside it allows, so a long list of countries next
      // to it leaves a taller chart rather than an empty band.
      const height = Math.max(220, Math.floor(host.clientHeight || 220));
      const pad = {top: 14, right: 14, bottom: 30, left: 34};
      const innerWidth = width - pad.left - pad.right;
      const innerHeight = height - pad.top - pad.bottom;
      const largest = Math.max(...points.map(point => point.count), 0);
      const step = Math.max(1, Math.ceil(largest / 4));
      const top = Math.max(step * Math.ceil(largest / step), step);
      const x = index => (points.length === 1 ? pad.left + innerWidth / 2 : pad.left + (index * innerWidth) / (points.length - 1));
      const y = value => pad.top + innerHeight - (value / top) * innerHeight;
      const chart = svg('svg', {width, height, viewBox: `0 0 ${width} ${height}`, role: 'img',
        'aria-label': `Enquiries per ${unit}, ${points.length} ${unit}s shown. Details in the table that follows.`});

      const grid = svg('g', {class: 'grid'});
      const axis = svg('g', {class: 'axis'});
      for (let value = 0; value <= top; value += step) {
        grid.append(svg('line', {x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value)}));
        const label = svg('text', {x: pad.left - 8, y: y(value) + 4, 'text-anchor': 'end'});
        label.textContent = num(value);
        axis.append(label);
      }
      const every = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(innerWidth / 70))));
      points.forEach((point, index) => {
        if (index % every !== 0) return;
        const anchor = points.length === 1 ? 'middle' : index === 0 ? 'start' : 'middle';
        const label = svg('text', {x: x(index), y: height - 8, 'text-anchor': anchor});
        label.textContent = point.short;
        axis.append(label);
      });
      chart.append(grid, axis);

      if (points.length > 1) {
        const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.count).toFixed(1)}`).join(' ');
        chart.append(svg('path', {class: 'area', d: `${line} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`}));
        chart.append(svg('path', {class: 'line', d: line}));
      }
      const dots = points.map((point, index) => {
        const dot = svg('circle', {class: 'dot', cx: x(index), cy: y(point.count), r: points.length > 60 ? 0 : 3.5});
        chart.append(dot);
        return dot;
      });
      const slot = points.length === 1 ? innerWidth : innerWidth / (points.length - 1);
      points.forEach((point, index) => {
        const hit = svg('rect', {class: 'hit', x: x(index) - slot / 2, y: pad.top, width: slot, height: innerHeight});
        hit.setAttribute('data-tip', `${point.label}: ${plural(point.count, 'enquiry', 'enquiries')}`);
        hit.addEventListener('pointerenter', () => { dots[index].classList.add('is-active'); dots[index].setAttribute('r', 5); });
        hit.addEventListener('pointerleave', () => { dots[index].classList.remove('is-active'); dots[index].setAttribute('r', points.length > 60 ? 0 : 3.5); });
        chart.append(hit);
      });
      host.replaceChildren(chart, alternative);
    };
    const alternative = el('div', 'dash-sr');
    const table = el('table');
    alternative.append(table);
    const head = el('tr');
    head.append(el('th', null, unit === 'week' ? 'Week' : 'Month'), el('th', null, 'Enquiries'));
    table.append(head);
    points.forEach(point => {
      const row = el('tr');
      row.append(el('td', null, point.label), el('td', null, point.count));
      table.append(row);
    });
    state.redraw.push(draw);
    return host;
  }

  /* ── Sections ─────────────────────────────────────────────────────── */

  function leaderValue(leader) {
    if (!leader) return '—';
    if (leader.labels.length === 1) return leader.labels[0];
    if (leader.labels.length === 2) return `${leader.labels[0]} & ${leader.labels[1]}`;
    return `${leader.labels.length}-way tie`;
  }
  function leaderNote(leader, total, empty) {
    if (!leader) return empty;
    const each = leader.labels.length > 1 ? ' each' : '';
    const names = leader.labels.length > 2 ? `${leader.labels.join(', ')} · ` : '';
    return `${names}${plural(leader.count, 'enquiry', 'enquiries')}${each} · ${share(leader.count, total)}`;
  }

  function headline(data) {
    const {summary, totals, applied} = data;
    const list = el('dl', 'kpis');
    const add = (term, value, note, {text = false, lead = false} = {}) => {
      const item = el('div', `kpi${lead ? ' is-lead' : ''}`);
      const dd = el('dd');
      dd.append(el('span', `kpi-value${text ? ' is-text' : ''}`, value), el('span', 'kpi-sub', note));
      item.append(el('dt', null, term), dd);
      list.append(item);
    };
    add('Total enquiries', num(summary.total),
      filtered(applied) ? `of ${num(totals.all)} in all` : totals.firstEnquiry ? `since ${day(totals.firstEnquiry)}` : 'None yet', {lead: true});
    add('This month', summary.thisMonth.inRange ? num(summary.thisMonth.count) : '—',
      summary.thisMonth.inRange ? summary.thisMonth.label : `${summary.thisMonth.label} is outside these dates`);
    add('Top country', leaderValue(summary.topCountry), leaderNote(summary.topCountry, summary.total, 'No country in view'), {text: true});
    add('Most requested experience', leaderValue(summary.topExperience),
      leaderNote(summary.topExperience, summary.total, 'No specific experience in view'), {text: true});
    return list;
  }

  function demand(data) {
    const base = data.summary.total;
    const noun = ['enquiry', 'enquiries'];

    const overTime = card('Enquiries over time', 'span-8', data.timeline.granularity === 'week' ? 'By week' : 'By month');
    overTime.append(timelineChart(data.timeline));
    const busiest = data.timeline.points.reduce((best, point) => (point.count > (best ? best.count : 0) ? point : best), null);
    const foot = el('p', 'card-foot');
    foot.textContent = busiest
      ? `Busiest: ${busiest.label} (${num(busiest.count)}). Periods with no enquiries show as 0.`
      : 'No enquiries in these dates.';
    overTime.append(foot);

    const countries = card('Where enquiries come from', 'span-4', `${num(base)} in view`);
    const countryRows = data.countries.items.map(item => ({label: item.label, count: item.count, kind: item.unmatched ? 'unmatched' : 'answer', tag: item.unmatched ? 'unmatched' : null}));
    if (data.countries.other.count) countryRows.push({label: `${plural(data.countries.other.countries, 'other country', 'other countries')}`, count: data.countries.other.count, kind: 'answer'});
    if (data.countries.notProvided) countryRows.push({label: data.blanks.country.label, count: data.countries.notProvided, kind: 'missing'});
    countries.append(countryRows.length ? hbars(countryRows, base, noun) : el('p', 'card-empty', 'No enquiries in view.'));
    if (data.countries.unmatched.length) {
      countries.append(el('p', 'card-foot', `Unmatched values are shown as written, not guessed: ${data.countries.unmatched.map(item => `“${item.label}”`).join(', ')}.`));
    }

    const experiences = card('Experiences requested', 'span-6', `${num(base)} in view`);
    const experienceRows = data.experiences.items.map(item => ({label: item.label, count: item.count, kind: 'answer'}));
    if (data.experiences.notSelected) experienceRows.push({label: data.blanks.experience.label, count: data.experiences.notSelected, kind: 'missing'});
    experiences.append(experienceRows.length ? hbars(experienceRows, base, noun) : el('p', 'card-empty', 'No enquiries in view.'));

    const travel = card('When they plan to travel', 'span-6', 'Arrival month');
    const points = data.travel.points.map(point => ({
      label: point.label, short: point.short, count: point.exact + point.approximate,
      tip: `${point.label}: ${plural(point.exact + point.approximate, 'enquiry', 'enquiries')} (${num(point.exact)} exact ${point.exact === 1 ? 'date' : 'dates'}, ${num(point.approximate)} rough ${point.approximate === 1 ? 'month' : 'months'})`,
      segments: [{kind: 'exact', count: point.exact}, {kind: 'approximate', count: point.approximate}],
    }));
    travel.append(columns(points, {labelEvery: 3, minWidth: '520px'}));
    travel.append(keyline([['answer', 'Exact arrival date', points.reduce((sum, point) => sum + point.segments[0].count, 0)], ['approximate', 'Rough month', points.reduce((sum, point) => sum + point.segments[1].count, 0)]]));
    const earlier = data.travel.earlier.exact + data.travel.earlier.approximate;
    const later = data.travel.later.exact + data.travel.later.approximate;
    const beyond = [];
    if (earlier) beyond.push(['answer', 'Before this month', earlier]);
    if (later) beyond.push(['answer', 'More than 18 months ahead', later]);
    beyond.push(['unsure', 'Not sure yet', data.travel.notSure]);
    beyond.push(['missing', data.blanks.timing.label, data.travel.blank]);
    if (data.travel.other) beyond.push(['other', 'Unreadable', data.travel.other]);
    travel.append(keyline(beyond));

    return section('Demand', null, [overTime, countries, experiences, travel]);
  }

  function ordinalCard(title, figure, blank, {note, medianLabel, span = 'span-4'}) {
    const node = card(title, span, figure.stated ? `${num(figure.stated)} stated` : null);
    node.append(columns(figure.items.map(item => ({
      label: item.label, short: item.label, count: item.count,
      tip: `${item.label}: ${plural(item.count, 'enquiry', 'enquiries')} · ${share(item.count, figure.base)}`,
    }))));
    const extras = [['unsure', 'Not sure yet', figure.notSure, figure.base], ['missing', blank.label, figure.blank, figure.base]];
    figure.other.forEach(item => extras.push(['other', `“${item.label}”`, item.count, figure.base]));
    node.append(keyline(extras));
    const callout = el('p', 'callout');
    if (figure.median) callout.append(`${medianLabel}: `, el('strong', null, figure.median));
    else callout.textContent = 'No stated answers in view.';
    node.append(callout);
    node.append(el('p', 'card-foot', `${blank.label}: ${blank.means}${note ? ` ${note}` : ''}`));
    return node;
  }

  function travellers(data) {
    const base = data.summary.total;
    const group = ordinalCard('Group size', data.groupSize, data.blanks.groupSize, {medianLabel: 'Median stated group'});
    const budget = ordinalCard('Budget per person', data.budget, data.blanks.budget, {medianLabel: 'Median stated budget', note: 'Excluding international flights.'});

    const trip = card('Custom trip length', 'span-4 md-12', data.tripLength.applicable ? plural(data.tripLength.applicable, 'custom enquiry', 'custom enquiries') : null);
    if (!data.tripLength.applicable) {
      trip.append(el('p', 'card-empty', 'No custom-trip enquiries in view. Length is asked only for custom trips.'));
    } else {
      const stats = el('dl', 'stats');
      const stat = (term, value, unit) => {
        const item = el('div', 'stat');
        const dd = el('dd', null, value === null ? '—' : num(value));
        if (value !== null && unit) dd.append(' ', el('small', null, unit));
        item.append(el('dt', null, term), dd);
        stats.append(item);
      };
      stat('Median', data.tripLength.median, 'days');
      stat('Average', data.tripLength.mean, 'days');
      stat('Range', null);
      stats.lastChild.querySelector('dd').textContent = data.tripLength.given ? `${num(data.tripLength.min)}–${num(data.tripLength.max)}` : '—';
      if (data.tripLength.given) stats.lastChild.querySelector('dd').append(' ', el('small', null, 'days'));
      trip.append(stats);
      if (data.tripLength.given) {
        trip.append(columns(data.tripLength.buckets.map(bucket => ({label: bucket.label, short: bucket.label, count: bucket.count,
          tip: `${bucket.label}: ${plural(bucket.count, 'custom enquiry', 'custom enquiries')}`}))));
      }
      trip.append(keyline([['answer', 'Gave a length', data.tripLength.given, data.tripLength.applicable], ['missing', data.blanks.tripLength.label, data.tripLength.notGiven, data.tripLength.applicable]]));
      trip.append(el('p', 'card-foot', `Median and average are over the ${plural(data.tripLength.given, 'custom enquiry', 'custom enquiries')} that gave a length.`));
    }

    const interests = card('Traveller interests', 'span-6', `% of ${num(base)} enquiries`);
    const interestRows = data.interests.items.map(item => ({label: item.label, count: item.count, kind: 'answer'}));
    interests.append(hbars(interestRows, base, ['enquiry', 'enquiries']));
    const interestKeys = [['answer', 'Chose at least one', data.interests.withAny, base], ['unsure', 'Asked us to recommend', data.interests.recommend, base], ['missing', data.blanks.interests.label, data.interests.none, base]];
    data.interests.other.forEach(item => interestKeys.push(['other', `“${item.label}”`, item.count, base]));
    interests.append(keyline(interestKeys));
    interests.append(el('p', 'card-foot', 'Several can be chosen, so these do not add up to 100%.'));

    const accommodation = card('Accommodation preference', 'span-3');
    accommodation.append(donut([
      ...data.accommodation.items.map((item, index) => ({label: item.label, count: item.count, colour: index})),
      {label: data.blanks.accommodation.label, count: data.accommodation.blank, missing: true},
      ...data.accommodation.other.map(item => ({label: `“${item.label}”`, count: item.count, missing: true})),
    ], base, ['enquiry', 'enquiries']));
    accommodation.append(el('p', 'card-foot', `${data.blanks.accommodation.label}: ${data.blanks.accommodation.means}`));

    const stack = el('div', 'dash-stack span-3');
    const children = card('Travelling with children', '');
    children.append(...split([
      ...data.children.items.map((item, index) => ({label: item.label, count: item.count, colour: index})),
      {label: data.blanks.children.label, count: data.children.blank, missing: true},
    ], base, ['enquiry', 'enquiries']));
    const contact = card('Preferred contact', '');
    contact.append(...split([
      ...data.contact.items.map((item, index) => ({label: item.label, count: item.count, colour: index})),
      {label: data.blanks.contact.label, count: data.contact.blank, missing: true},
    ], base, ['enquiry', 'enquiries']));
    stack.append(children, contact);

    return section('Trip and preferences', `Percentages are of the ${plural(base, 'enquiry', 'enquiries')} in view.`, [group, budget, trip, interests, accommodation, stack]);
  }

  function recentSection(data) {
    const {recent} = data;
    const node = card('Recent enquiries', 'span-12', recent.items.length ? `Showing ${num(recent.items.length)} of ${num(recent.total)}` : null);
    if (!recent.items.length) {
      node.append(el('p', 'card-empty', 'No enquiries in view.'));
      return section('Enquiries', null, [node]);
    }
    const scroll = el('div', 'table-scroll');
    const table = el('table', 'recent');
    const head = el('tr');
    ['Received', 'Reference', 'Name', 'Country', 'Experience', 'Group', 'Travel', 'Status'].forEach(label => {
      const th = el('th', null, label);
      th.scope = 'col';
      head.append(th);
    });
    const thead = el('thead');
    thead.append(head);
    const body = el('tbody');
    recent.items.forEach(item => {
      const row = el('tr');
      const received = el('td', 'dash-num', day(item.createdAt));
      received.title = dayTime(item.createdAt);
      const refCell = el('td');
      const button = el('button', 'ref-button', item.reference);
      button.type = 'button';
      button.setAttribute('data-reference', item.reference);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-label', `Open enquiry ${item.reference}${item.name ? ` from ${item.name}` : ''}`);
      refCell.append(button);
      const country = el('td', null, item.country);
      if (item.countryUnmatched) country.append(el('span', 'tag', 'unmatched'));
      const travel = el('td', item.timing ? null : 'muted', item.timing || '—');
      if (!item.timing) travel.title = data.blanks.timing.label;
      const status = el('td');
      status.append(el('span', 'status-pill', item.status));
      row.append(received, refCell, el('td', null, item.name || '—'), country, el('td', null, item.experience), el('td', null, item.groupSize), travel, status);
      body.append(row);
    });
    table.append(thead, body);
    table.addEventListener('click', event => {
      const button = event.target.closest('[data-reference]') || (event.target.closest('tbody tr') || {querySelector() { return null; }}).querySelector('[data-reference]');
      if (button) openEnquiry(button.getAttribute('data-reference'), button);
    });
    scroll.append(table);
    node.append(scroll);

    if (recent.total > recent.items.length) {
      const more = el('div', 'more-row');
      if (recent.limit < 100) {
        const button = el('button', 'button-quiet', `Show ${Math.min(recent.limit, recent.total - recent.items.length) === recent.limit ? recent.limit : recent.total - recent.items.length} more`);
        button.type = 'button';
        button.addEventListener('click', () => {
          state.params.set('recent', String(recent.limit === 25 ? 50 : 100));
          state.focusAfter = recent.items.length;
          load();
        });
        more.append(button);
      } else {
        more.append(el('p', 'card-foot', 'Showing the latest 100. Narrow the dates to reach older enquiries.'));
      }
      node.append(more);
    }
    return section('Enquiries', 'Open a reference to read the full enquiry.', [node]);
  }

  function notes(data) {
    const node = card('Reading these figures', 'span-12');
    const body = el('div', 'notes');
    body.append(keyline([['answer', 'An answer somebody gave', 0], ['unsure', '“Not sure yet”, chosen on the form', 0], ['missing', 'No answer: skipped, not asked, or asked only later', 0], ['unmatched', 'Could not be matched, shown as written', 0]]));
    body.querySelectorAll('.keyline b').forEach(node => node.remove());
    const zero = el('p');
    zero.append(el('strong', null, '0'), ' means an answer that nobody in view gave. A missing answer is never counted as 0 or folded into another answer.');
    const scopeNote = el('p', null, 'Every figure on this page describes the same enquiries: change a filter and all of them change together. Dates are in GMT.');
    body.append(zero, scopeNote);
    node.append(body);
    return section('Notes', null, [node]);
  }

  function render(data) {
    state.redraw = [];
    scopeText(data);
    if (stamp) stamp.textContent = `Updated ${dayTime(data.generatedAt)}`;

    if (!data.totals.all) {
      showMessage('No enquiries yet.', 'Figures appear here as soon as the first enquiry is stored.');
      return;
    }
    const content = el('div', 'dash-content');
    content.append(section('Overview', null, [headline(data)]));
    content.firstChild.querySelector('.dash-grid').replaceWith(content.firstChild.querySelector('.kpis'));
    if (!data.totals.view) {
      const clear = el('button', 'button-quiet', 'Clear filters');
      clear.type = 'button';
      clear.addEventListener('click', clearFilters);
      const box = el('div', 'dash-message');
      box.append(el('h2', null, 'No enquiries match these filters.'), el('p', null, `There are ${num(data.totals.all)} enquiries in all.`), clear);
      content.append(box);
    } else {
      content.append(demand(data), travellers(data), recentSection(data), notes(data));
    }
    root.replaceChildren(content);
    state.redraw.forEach(draw => draw());
    if (state.focusAfter !== null) {
      const buttons = root.querySelectorAll('[data-reference]');
      if (buttons[state.focusAfter]) buttons[state.focusAfter].focus();
      state.focusAfter = null;
    }
  }

  let resizeFrame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => state.redraw.forEach(draw => draw()));
  }).observe(root);

  /* ── One enquiry ──────────────────────────────────────────────────── */

  function detailGroup(title, rows) {
    const group = el('section', 'detail-group');
    group.append(el('h3', null, title));
    const list = el('dl', 'detail-list');
    rows.filter(Boolean).forEach(([term, value, note]) => {
      const dd = el('dd');
      if (value && typeof value === 'object' && 'nodeType' in value) dd.append(value);
      else if (value && typeof value === 'object') {
        dd.textContent = value.value;
        if (value.missing) dd.classList.add('is-missing');
      } else dd.textContent = value;
      if (note) dd.append(el('span', 'detail-note', note));
      list.append(el('dt', null, term), dd);
    });
    group.append(list);
    return group;
  }

  function link(href, text) {
    const anchor = el('a', null, text);
    anchor.href = href;
    return anchor;
  }

  function renderEnquiry(enquiry, sharedReference) {
    const {traveler, trip, preferences, record} = enquiry;
    drawerTitle.textContent = traveler.name || record.reference;
    const meta = el('div', 'drawer-meta');
    meta.append(el('span', 'drawer-ref', record.reference), el('span', 'status-pill', record.status), el('span', null, `Received ${dayTime(record.receivedAt)}`));
    const parts = [meta];
    if (sharedReference) parts.push(el('p', 'drawer-notice', 'Another enquiry has the same reference. This is the most recent one.'));

    parts.push(detailGroup('Traveller', [
      ['Name', traveler.name || {value: 'Not given', missing: true}],
      ['Country', traveler.country, traveler.country.unmatched ? 'Shown as written; not matched to a country.' : null],
      ['Email', traveler.email ? link(`mailto:${traveler.email}`, traveler.email) : {value: 'Not given', missing: true}],
      ['Phone', traveler.phone ? link(`tel:${traveler.phone.replace(/[^\d+]/g, '')}`, traveler.phone) : {value: 'Not given', missing: true}],
      ['Preferred contact', traveler.contactMethod],
    ]));

    const timing = trip.timing.kind === 'exact'
      ? [['Arrival date', day(trip.timing.arrival)], ['Departure date', trip.timing.departure ? day(trip.timing.departure) : {value: 'Not given', missing: true}]]
      : trip.timing.kind === 'approximate'
        ? [['Travel month', trip.timing.month, 'A rough month, not an exact date.']]
        : [['Travel timing', {value: trip.timing.value, missing: trip.timing.kind === 'blank'}]];
    parts.push(detailGroup('Trip', [
      ['Experience', trip.experience],
      ['Group size', trip.groupSize],
      ...timing,
      ['Dates flexible', trip.flexibility],
      trip.tripLength ? ['Trip length', trip.tripLength] : null,
      ['Accommodation', trip.accommodation],
      ['Children', trip.children],
      trip.children.ages ? ["Children's ages", trip.children.ages] : null,
    ]));

    let interests;
    if (preferences.interests.missing) interests = {value: preferences.interests.blankLabel, missing: true};
    else {
      interests = el('span', 'chips');
      preferences.interests.items.forEach(label => interests.append(el('span', 'chip', label)));
      if (preferences.interests.recommend) interests.append(el('span', 'chip is-unsure', preferences.interests.recommendLabel));
    }
    parts.push(detailGroup('Preferences', [['Budget per person', preferences.budget], ['Interests', interests]]));

    const message = el('section', 'detail-group');
    message.append(el('h3', null, 'Message'));
    message.append(enquiry.message ? el('p', 'detail-message', enquiry.message) : el('p', 'card-empty', 'No message.'));
    parts.push(message);

    parts.push(detailGroup('Record', [
      ['Reference', record.reference],
      ['Received', dayTime(record.receivedAt)],
      ['Source', record.source || {value: 'Not recorded', missing: true}],
      ['Status', record.status],
    ]));
    drawerBody.replaceChildren(...parts);
    drawerBody.scrollTop = 0;
  }

  function openEnquiry(reference, trigger) {
    state.trigger = trigger;
    const token = ++state.detailToken;
    drawerTitle.textContent = reference;
    drawerBody.replaceChildren(el('p', 'drawer-state', 'Loading enquiry…'));
    // The dialog hands focus back to whatever had it when it opened. A click on
    // a row's other cells focuses nothing, so the reference takes focus first.
    if (!drawer.open) {
      trigger.focus({preventScroll: true});
      drawer.showModal();
    }
    fetch(`/api/dashboard/enquiry?reference=${encodeURIComponent(reference)}`, {headers: {Accept: 'application/json'}, credentials: 'same-origin'})
      .then(response => {
        if (response.ok) return response.json();
        throw new Error(response.status === 401 ? 'This dashboard is private. Sign in through Cloudflare Access.'
          : response.status === 404 ? 'No enquiry has this reference any more.' : 'This enquiry could not be read. Try again shortly.');
      })
      .then(body => { if (token === state.detailToken) renderEnquiry(body.enquiry, body.sharedReference); })
      .catch(error => {
        if (token !== state.detailToken) return;
        drawerBody.replaceChildren(el('p', 'drawer-state', error.message.startsWith('This') || error.message.startsWith('No') ? error.message : 'This enquiry could not be read. Check the connection and try again.'));
      });
  }

  drawer.querySelector('[data-drawer-close]').addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', event => { if (event.target === drawer) drawer.close(); });
  drawer.addEventListener('close', () => {
    state.detailToken += 1;
    // After the browser's own focus restoration, which runs once this returns.
    const trigger = state.trigger;
    requestAnimationFrame(() => { if (trigger && document.contains(trigger)) trigger.focus(); });
  });

  load();
}());
