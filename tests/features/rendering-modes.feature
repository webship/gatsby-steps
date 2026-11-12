# Server-side rendering and deferred static generation need `gatsby serve`
# (a plain static file server answers 404 for them).
Feature: Rendering modes
  As a visitor
  I want pages rendered at build time, on request or on first visit to look alike
  So that I cannot tell how a page was made

  Scenario: A page rendered on the server on every request
    Given I am on "/using-ssr/"
    Then the page title should be "Using SSR | Gatsby Default Starter"
    And I should see "This page is rendered server-side"
    And I should see "Rendered on the server at" without JavaScript
    And the page-data for "/using-ssr/" should be available

  Scenario: A page generated on the first request and then kept
    Given I am on "/using-dsg/"
    Then the page title should be "Using DSG | Gatsby Default Starter"
    And I should see "Hello from a DSG Page"
    And the page-data for "/using-dsg/" should be available
