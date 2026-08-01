@requires-auth
Feature: Admin Basic Auth
  As the site owner
  I want the ddev-hosted site locked behind HTTP Basic Auth
  So that only credentialed visitors (the "admin" account) can reach it

  Scenario: Unauthenticated requests are rejected
    Then requesting "/" without credentials should return 401
    And requesting "/page-data/index/page-data.json" without credentials should return 401

  Scenario: The admin account can reach the homepage
    Given I am on the homepage
    Then the page title should be "Home | Gatsby Default Starter"
    And I should see a hydrated page
