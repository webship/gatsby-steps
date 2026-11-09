# The titles, copy and link texts below are those of gatsby-starter-default;
# swap them for your own content when you copy this feature.
Feature: 404 page
  As a visitor
  I want a helpful page when I request a route that doesn't exist
  So that I'm not left looking at a bare error

  Scenario: Unknown route renders the default 404 page
    When I go to "/this-page-does-not-exist/"
    Then I should be on the default 404 page
    And the page title should be "404: Not Found | Gatsby Default Starter"
