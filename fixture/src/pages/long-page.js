import * as React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const paragraphs = Array.from({ length: 60 }, (_, index) => index + 1)

const LongPage = () => (
  <Layout>
    <h1>A long page</h1>
    <p>
      <a href="#middle">Jump to the middle</a>
    </p>
    {paragraphs.map(number => (
      <React.Fragment key={number}>
        {number === 30 && <h2 id="middle">The middle</h2>}
        <p>
          Paragraph {number}. This text only exists to make the page taller
          than the browser window, so that the scroll position can be restored.
        </p>
      </React.Fragment>
    ))}
    <h2 id="conclusion">Conclusion</h2>
    <p>
      <Link to="/page-2/">Continue to page two</Link>
    </p>
  </Layout>
)

export const Head = () => <Seo title="A long page" />

export default LongPage
