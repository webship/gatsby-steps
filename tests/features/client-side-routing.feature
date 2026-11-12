Feature: Client-side routing
  As a visitor
  I want to move between pages without the whole page reloading
  So that navigation is fast and keeps my place

  Scenario: A link opens the next page without a full page reload
    Given I am on the homepage
    When I click the link "Page 2" without a full page reload
    Then I should be on "/page-2/"
    And the page title should be "Page two | Gatsby Default Starter"
    And I should see "Hi from the second page"
