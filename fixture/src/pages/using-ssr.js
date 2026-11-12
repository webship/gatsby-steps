import * as React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

// The starter's page reads a random photo from an external service in
// getServerData. This copy has no external call, so the test suite does not
// depend on the network; it is still rendered on the server on every request.
const UsingSSR = ({ serverData }) => {
  return (
    <Layout>
      <h1>
        This page is <b>rendered server-side</b>
      </h1>
      <p>
        This page is rendered server side every time the page is requested.
        Reload it to see a new time:
      </p>
      <p>
        Rendered on the server at <code>{serverData.renderedAt}</code>
      </p>
      <Link to="/">Go back to the homepage</Link>
    </Layout>
  )
}

export const Head = () => <Seo title="Using SSR" />

export default UsingSSR

export async function getServerData() {
  return {
    props: {
      renderedAt: new Date().toISOString(),
    },
  }
}
