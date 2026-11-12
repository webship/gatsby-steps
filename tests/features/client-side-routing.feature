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

  Scenario: The route announcer tells screen readers about the new page
    Given I am on the homepage
    Then the page should have a route announcer
    When I click the link "Page 2" without a full page reload
    Then the route announcer should announce "Hi from the second page"
    When I click the link "Go back to the homepage" without a full page reload
    Then the route announcer should announce "Welcome to Gatsby!"

  Scenario: Going back does not reload the page
    Given I am on the homepage
    When I click the link "Page 2" without a full page reload
    And I go back without a full page reload
    Then I should be on the homepage
    And I should see "Welcome to Gatsby!"

  Scenario: Hovering a link prefetches its page
    Given I am on "/long-page/"
    And I should see a hydrated page
    Then the page "/page-2/" should not be prefetched
    When I hover over "a[href='/page-2/']"
    Then the page "/page-2/" should be prefetched

  Scenario: The scroll position is restored when going back
    Given I am on "/long-page/"
    And I should see a hydrated page
    When I click the link "Continue to page two" without a full page reload
    Then I should be on "/page-2/"
    When I go back without a full page reload
    Then I should be on "/long-page/"
    And the scroll position should be restored

  Scenario: A link to a section scrolls to it
    Given I am on "/long-page/"
    And I should see a hydrated page
    When I click "Jump to the middle"
    Then "#middle" should be in the viewport
