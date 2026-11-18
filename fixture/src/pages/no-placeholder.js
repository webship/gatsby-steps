import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"

const NoPlaceholderPage = () => (
  <Layout>
    <h1>An image without a placeholder</h1>
    <p>The image below has no placeholder and only its own format.</p>
    <StaticImage
      src="../images/example.png"
      alt="An example image without a placeholder"
      width={200}
      placeholder="none"
      formats={["auto"]}
    />
  </Layout>
)

export const Head = () => <Seo title="No placeholder" />

export default NoPlaceholderPage
