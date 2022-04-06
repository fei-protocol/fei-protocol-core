# Monitoring Infrastructure

Montioring of protocol events and metrics is done through a combination of OpenZeppelin Defender and Datadog.

## OpenZeppelin Defender

The Fei Labs OpenZeppelin Defender instance contains a set of scripts that monitor particular protocol statistics - such as PSM balances, PCV deposits balances, and so on. These scripts are compiled and uploaded to Defender to run every 5 minutes, pushing the stats to Datadog to be displayed. See the fei-protocol/internal (private) repository for more specific information on this.

## Datadog

Stats pushed from the Defender instance go into Datadog, and can be indexed and graphed on Dashboards. The primary monitoring dashboard is [here](https://p.datadoghq.com/sb/03e91a80-2ae7-11ec-8f45-da7ad0900002-c8e87f93a08b60e64b5b372440b916a2)

