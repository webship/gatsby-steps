# The titles, copy and link texts below are those of gatsby-starter-default;
# swap them for your own content when you copy this feature.
Feature: Page 2
  As a visitor
  I want the "Page 2" page to render correctly
  So that I know file-based page routing works

  Scenario: Page 2 loads and is hydrated
    Given I am on "/page-2/"
    Then the page title should be "Page two | Gatsby Default Starter"
    And I should see a hydrated page
    And I should see "Hi from the second page"
    And the page-data for "/page-2/" should be available

  Scenario: Page 2 navigates back to the homepage via client-side routing
    Given I am on "/page-2/"
    When I click the link "Go back to the homepage" without a full page reload
    Then I should be on the homepage
