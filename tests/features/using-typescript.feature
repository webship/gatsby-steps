# The titles, copy and link texts below are those of gatsby-starter-default;
# swap them for your own content when you copy this feature.
Feature: Using TypeScript page
  As a visitor
  I want the "Using TypeScript" page to render correctly
  So that I know a TypeScript page is built like any other

  Scenario: Using TypeScript page loads
    Given I am on "/using-typescript/"
    Then the page title should be "Using TypeScript | Gatsby Default Starter"
    And I should see a hydrated page
    And I should see "Gatsby supports TypeScript by default"
    And the page-data for "/using-typescript/" should be available
