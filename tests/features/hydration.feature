Feature: Hydration
  As a visitor
  I want every page to work once it has loaded
  So that links and scripts respond

  Scenario Outline: The pages hydrate without errors
    Given I am on "<path>"
    Then I should see a hydrated page
    And there should be no hydration errors

    Examples:
      | path               |
      | /                  |
      | /page-2/           |
      | /using-typescript/ |
      | /images/           |
      | /using-ssr/        |
      | /using-dsg/        |

  # The page below renders differently on the server and in the browser on
  # purpose: it proves that the hydration check can fail.
  @js-off
  Scenario: A page that renders differently in the browser reports hydration errors
    Given I am on "/hydration-mismatch/"
    Then there should be hydration errors
