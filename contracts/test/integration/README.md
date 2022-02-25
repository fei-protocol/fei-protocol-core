# Integration Tests
These are integration tests that are used to validate interactions with other protocols.

To add a new test, ensure that the name of the contract test file includes `IntegrationTest`. The `forge` test command uses a regex of that string in order to run the `IntegrationTests` with the required mainnet keys etc.