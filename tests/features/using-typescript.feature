Feature: Using TypeScript page
  As a visitor
  I want the gatsby-starter-default "Using TypeScript" page to render correctly
  So that I know Gatsby's TypeScript page support works

  Scenario: Using TypeScript page loads
    Given I am on "/using-typescript/"
    Then the page title should be "Using TypeScript | Gatsby Default Starter"
    And I should see a hydrated page
    And I should see "Gatsby supports TypeScript by default"
    And the page-data for "/using-typescript/" should be available
