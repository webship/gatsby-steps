# The copy and the title below are those of gatsby-starter-default; swap them
# for your own content when you copy this feature.
Feature: 404 page
  As a visitor
  I want a helpful page when I request a route that doesn't exist
  So that I'm not left looking at a bare error

  Scenario: The build produced a 404 page
    Given I am on the homepage
    Then the 404 page should be available

  Scenario: An unknown route answers 404 with the site's 404 page
    When I go to "/this-page-does-not-exist/"
    Then I should be on a 404 page
    And the response status code should be 404
    And I should be on the default 404 page
    And the page title should be "404: Not Found | Gatsby Default Starter"
    And the route announcer should not announce "Home"

  Scenario: A known route is not a 404 page
    Given I am on "/page-2/"
    Then I should not be on a 404 page
