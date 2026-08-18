import {trustFields} from './objects/trustFields'
import {mediaAsset} from './objects/mediaAsset'

import {siteSettings} from './documents/siteSettings'
import {navigation} from './documents/navigation'
import {homepageSection} from './documents/homepageSection'
import {flexibleSection} from './documents/flexibleSection'
import {founderProfile} from './documents/founderProfile'
import {originStory} from './documents/originStory'
import {experiencePathway} from './documents/experiencePathway'
import {tour} from './documents/tour'
import {featuredTourCollection} from './documents/featuredTourCollection'
import {hostingPrinciple} from './documents/hostingPrinciple'
import {guestStory} from './documents/guestStory'
import {review} from './documents/review'
import {trustFact} from './documents/trustFact'
import {planningStep} from './documents/planningStep'
import {socialStory} from './documents/socialStory'
import {cta} from './documents/cta'
import {policy} from './documents/policy'
import {bookingFlow} from './documents/bookingFlow'
import {aboutPage} from './documents/aboutPage'

export const schemaTypes = [
  // Reusable objects
  trustFields,
  mediaAsset,

  // Documents — see docs/sprint-2-information-architecture.md "Content model"
  siteSettings,
  navigation,
  homepageSection,
  flexibleSection,
  founderProfile,
  originStory,
  experiencePathway,
  tour,
  featuredTourCollection,
  hostingPrinciple,
  guestStory,
  review,
  trustFact,
  planningStep,
  socialStory,
  cta,
  policy,
  bookingFlow,
  aboutPage,
]
