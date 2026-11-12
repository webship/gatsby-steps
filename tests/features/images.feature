Feature: Optimized images
  As a visitor
  I want images that load fast and do not move the page
  So that the site feels quick on any connection

  Scenario: An image below the fold loads when it is scrolled into view
    Given I am on "/images/"
    And I should see a hydrated page
    Then I should see an optimized image
    And the optimized image should have a placeholder
    And the optimized image should not be loaded
    When I scroll to the bottom of the page
    Then the optimized image should be loaded
    And the optimized image should offer the "webp" format
    And the optimized image should offer the "avif" format

  Scenario: A page without an optimized image
    Given I am on "/page-2/"
    Then I should not see an optimized image
