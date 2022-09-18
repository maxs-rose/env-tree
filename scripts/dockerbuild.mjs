#!/usr/bin/env zx

import { $ } from 'zx';

await $`docker build . -t env-tree -f docker/cloud.Dockerfile`;
