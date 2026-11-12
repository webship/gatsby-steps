import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"

// This page is broken on purpose: the server renders "server" and the browser
// renders "browser", so React reports a hydration error. The test suite uses
// it to prove that the hydration check can fail.
const HydrationMismatchPage = () => (
  <Layout>
    <h1>Hydration mismatch</h1>
    <p>{typeof window === `undefined` ? `Rendered on the server` : `Rendered in the browser`}</p>
  </Layout>
)

export const Head = () => <Seo title="Hydration mismatch" />

export default HydrationMismatchPage
