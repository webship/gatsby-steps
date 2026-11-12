'use strict';

// Entry point of @webship-js/gatsby-steps: require this one file and the step
// definitions for Gatsby sites are registered.
//
//   gatsby-site.steps.js     the build and runtime: generator, production
//                            build, hydration, build id, Head API, web app
//                            manifest, the page without JavaScript
//   gatsby-routing.steps.js  client-side routing
//   gatsby-content.steps.js  optimized images, page-data, the 404 page, the title
//   gatsby-helpers.js        shared helpers and the hydration error recorder
//                            (not a step file)
//
// Every assertion waits for its condition for the `minWaitTime.page` budget
// (at least 10 s) and every failure is a friendly error with a hint, instead
// of a raw assertion or Playwright stack. The target must be a production
// build served with `gatsby serve`, not `gatsby develop`.

require('./gatsby-site.steps');
require('./gatsby-routing.steps');
require('./gatsby-content.steps');
