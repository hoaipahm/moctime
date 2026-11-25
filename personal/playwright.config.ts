import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:45000,fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:4317',headless:true,viewport:{width:390,height:844},trace:'retain-on-failure'},reporter:[['list'],['json',{outputFile:'qa/browser-results.json'}]]});
