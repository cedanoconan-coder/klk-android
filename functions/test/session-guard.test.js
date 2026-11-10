"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {isAuthTimeAfterRevocation}=require("../session-guard");
test("permite sesiones cuando no existe revocación",()=>assert.equal(isAuthTimeAfterRevocation(100,null),true));
test("permite autenticación posterior a revocación",()=>assert.equal(isAuthTimeAfterRevocation(201,200),true));
test("rechaza tokens anteriores o del mismo segundo",()=>{assert.equal(isAuthTimeAfterRevocation(199,200),false);assert.equal(isAuthTimeAfterRevocation(200,200),false);});
test("rechaza marcas de autenticación inválidas",()=>{assert.equal(isAuthTimeAfterRevocation("201",200),false);assert.equal(isAuthTimeAfterRevocation(-1,null),false);});
