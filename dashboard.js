/* The internal enquiry dashboard.
 *
 * It knows nothing about the database. It asks one endpoint for figures that
 * are already counted and draws them; there is no query here to tamper with,
 * no binding to leak, and nothing personal in what comes back.
 *
 * The charts are hand-drawn from the numbers rather than pulled from a
 * library. The site's Content-Security-Policy allows scripts from this origin
 * only, so a chart library could not load even if one were worth the weight —
 * and four bar charts are not.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-dash-root]');
  var stamp = document.querySelector('[data-dash-stamp]');
  if (!root) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function message(title, detail) {
    var box = el('div', 'dash-message');
    box.appendChild(el('h2', null, title));
    box.appendChild(el('p', null, detail));
    root.replaceChildren(box);
  }

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function monthLabel(value) {
    var parts = String(value || '').split('-');
    var index = Number(parts[1]) - 1;
    if (!parts[0] || !(index >= 0 && index < 12)) return value || '';
    return MONTH_NAMES[index] + ' ' + parts[0].slice(2);
  }

  function dayLabel(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toISOString().slice(0, 10);
  }

  function card(term, value, isText) {
    var wrap = el('div', 'dash-card');
    wrap.appendChild(el('dt', null, term));
    var dd = el('dd', isText ? 'is-text' : null, value);
    wrap.appendChild(dd);
    return wrap;
  }

  // One scale across a chart, taken from its own largest bar, so a bar's
  // length means something within the chart and never between charts.
  function barChart(title, entries, limit) {
    var panel = el('section', 'dash-panel');
    panel.appendChild(el('h2', null, title));
    var shown = entries.slice(0, limit || 10);
    if (!shown.length) {
      panel.appendChild(el('p', 'is-empty', 'No enquiries yet.'));
      return panel;
    }
    var largest = shown.reduce(function (most, entry) { return Math.max(most, entry.count); }, 0) || 1;
    var list = el('div', 'bars');
    shown.forEach(function (entry) {
      var row = el('div', 'bar-row' + (entry.key && entry.key.indexOf('raw:') === 0 ? ' is-unresolved' : ''));
      var label = el('span', 'bar-label', entry.label);
      label.title = entry.label;
      row.appendChild(label);
      var track = el('span', 'bar-track');
      var fill = el('span', 'bar-fill');
      fill.style.width = Math.max(2, Math.round((entry.count / largest) * 100)) + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'bar-count', entry.count));
      list.appendChild(row);
    });
    panel.appendChild(list);
    return panel;
  }

  function monthChart(months) {
    var panel = el('section', 'dash-panel is-wide');
    panel.appendChild(el('h2', null, 'Enquiries over time'));
    if (!months.length) {
      panel.appendChild(el('p', 'is-empty', 'No enquiries yet.'));
      return panel;
    }
    var largest = months.reduce(function (most, entry) { return Math.max(most, entry.count); }, 0) || 1;
    var strip = el('div', 'months');
    months.forEach(function (entry) {
      var column = el('div', 'month');
      column.appendChild(el('span', 'month-count', entry.count));
      var bar = el('span', 'month-bar');
      bar.style.height = Math.max(2, Math.round((entry.count / largest) * 120)) + 'px';
      column.appendChild(bar);
      column.appendChild(el('span', 'month-label', monthLabel(entry.month)));
      strip.appendChild(column);
    });
    panel.appendChild(strip);
    return panel;
  }

  var COLUMNS = [
    ['Date', function (row) { return dayLabel(row.createdAt); }, 'is-date'],
    ['Reference', function (row) { return row.reference; }, 'is-ref'],
    ['Name', function (row) { return row.name; }, null],
    ['Country', function (row) { return row.country; }, null],
    ['Tour interest', function (row) { return row.tour || '—'; }, null],
    ['Group size', function (row) { return row.groupSize || '—'; }, null],
    ['Travel date', function (row) { return row.travelDate || '—'; }, 'is-date'],
    ['Contact', function (row) { return row.contactMethod || '—'; }, null],
  ];

  function recentTable(rows) {
    var panel = el('section', 'dash-panel is-wide');
    panel.appendChild(el('h2', null, 'Recent enquiries'));
    if (!rows.length) {
      panel.appendChild(el('p', 'is-empty', 'No enquiries yet.'));
      return panel;
    }
    var wrap = el('div', 'dash-table-wrap');
    var table = el('table', 'dash-table');
    var head = el('tr');
    COLUMNS.forEach(function (column) { head.appendChild(el('th', null, column[0])); });
    head.appendChild(el('th', null, 'Status'));
    var thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);

    var body = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr');
      COLUMNS.forEach(function (column) { tr.appendChild(el('td', column[2], column[1](row))); });
      var statusCell = el('td');
      statusCell.appendChild(el('span', 'status', row.status || 'new'));
      tr.appendChild(statusCell);
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    panel.appendChild(wrap);
    return panel;
  }

  function render(data) {
    var summary = data.summary || {};
    var fragment = document.createDocumentFragment();

    var cards = el('dl', 'dash-cards');
    cards.appendChild(card('Total enquiries', summary.total || 0));
    cards.appendChild(card('This month', summary.thisMonth || 0));
    cards.appendChild(card('Top country', summary.topCountry || '—', true));
    cards.appendChild(card('Most requested', summary.topTour || '—', true));
    fragment.appendChild(cards);

    var panels = el('div', 'dash-panels');
    panels.appendChild(barChart('Enquiries by country', data.countries || []));
    panels.appendChild(barChart('Enquiries by experience', data.tours || []));
    panels.appendChild(barChart('Group size', data.groupSizes || [], 8));
    panels.appendChild(monthChart(data.months || []));
    fragment.appendChild(panels);

    var recent = el('div', 'dash-panels');
    recent.appendChild(recentTable(data.recent || []));
    fragment.appendChild(recent);

    var unresolved = (data.countries || []).filter(function (entry) {
      return entry.key && entry.key.indexOf('raw:') === 0;
    });
    if (unresolved.length) {
      fragment.appendChild(el('p', 'dash-note',
        unresolved.length + ' country value' + (unresolved.length === 1 ? '' : 's')
        + ' could not be matched to a country and are shown as written.'));
    }

    root.replaceChildren(fragment);
    if (stamp && data.generatedAt) stamp.textContent = 'Read ' + new Date(data.generatedAt).toLocaleString();
  }

  fetch('/api/dashboard', {headers: {Accept: 'application/json'}, credentials: 'same-origin'})
    .then(function (response) {
      if (response.status === 401) {
        message('This dashboard is private.', 'Sign in through Cloudflare Access to read it.');
        return null;
      }
      if (!response.ok) {
        message('The figures could not be read.', 'The database did not answer. Try again shortly.');
        return null;
      }
      return response.json();
    })
    .then(function (data) { if (data) render(data); })
    .catch(function () {
      message('The figures could not be read.', 'Check the connection and try again.');
    });
}());
