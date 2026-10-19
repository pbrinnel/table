#!/bin/bash
# Double-click in Finder to open the labs: the same local server as the game,
# opened at the labs' index. The leading _ keeps this file off the published site.
exec "$(dirname "$0")/_play-mac.command" _labs/
