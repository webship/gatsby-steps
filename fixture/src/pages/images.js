import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"

const ImagesPage = () => (
  <Layout>
    <h1>Optimized images</h1>
    <p>The image below the fold is loaded lazily, with a blurred placeholder.</p>
    <div style={{ height: `6000px` }} aria-hidden="true" />
    <StaticImage
      src="../images/example.png"
      alt="An example of a lazily loaded optimized image"
      width={320}
      placeholder="blurred"
      loading="lazy"
      formats={["auto", "webp", "avif"]}
    />
  </Layout>
)

export const Head = () => <Seo title="Optimized images" />

export default ImagesPage
