Feature: Home page
  As a visitor
  I want the gatsby-starter-default home page to render correctly
  So that I know the Gatsby build and hydration succeeded

  Scenario: Home page loads and hydrates
    Given I am on the homepage
    Then the page title should be "Home | Gatsby Default Starter"
    And I should see a hydrated page
    And I should see "Welcome to Gatsby!"
    And I should see an optimized image
    And the page-data for "/" should be available

  Scenario: Home page navigates to Page 2 via client-side routing
    Given I am on the homepage
    When I click the link "Page 2" without a full page reload
    Then I should be on "/page-2/"
    And the page title should be "Page two | Gatsby Default Starter"
