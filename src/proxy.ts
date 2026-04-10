import type { NextProxy, NextRequest, ProxyConfig } from 'next/server'

export const proxy: NextProxy = async (_request: NextRequest) => {}

export const config: ProxyConfig = {}
