/**
 * Type declarations for better-sqlite3
 * This file ensures TypeScript recognizes the better-sqlite3 module
 */

declare module 'better-sqlite3' {
  import { EventEmitter } from 'events'

  interface RunResult {
    changes: number
    lastInsertRowid: number
  }

  interface PrepareOptions {
    [key: string]: any
  }

  interface Statement<T = any> {
    run(...params: any[]): RunResult
    get(...params: any[]): T | undefined
    all(...params: any[]): T[]
    iterate(...params: any[]): IterableIterator<T>
    pluck(toggleState?: boolean): this
    expand(toggleState?: boolean): this
    safeIntegers(toggleState?: boolean): this
    raw(toggleState?: boolean): this
    bind(...params: any[]): this
    columns(): Array<{ name: string; column: string | null; type: string | null; nullable: boolean | null; defaultValue: any }>
  }

  interface DatabaseOptions {
    verbose?: (message?: any, ...additionalArgs: any[]) => void
    nativeBinding?: string
  }

  class Database extends EventEmitter {
    constructor(filename: string, options?: DatabaseOptions)
    
    prepare(source: string): Statement
    exec(source: string): this
    pragma(source: string, options?: { simple?: boolean }): any
    checkpoint(databaseName?: string): this
    function(name: string, options?: { varargs?: boolean; deterministic?: boolean; directOnly?: boolean }, callback: (...params: any[]) => any): this
    aggregate(name: string, options?: { varargs?: boolean; deterministic?: boolean; directOnly?: boolean }, start: any, step: (previous: any, ...params: any[]) => any, inverse?: (previous: any, ...params: any[]) => any, result?: (previous: any) => any): this
    table(name: string, factory: (row: any) => any): this
    loadExtension(path: string): this
    transaction<T extends (...args: any[]) => any>(fn: T): T
    close(): this
    defaultSafeIntegers(toggleState?: boolean): this
    backup(destination: string | Database, options?: { attached?: string; progress?: (info: { totalPages: number; remainingPages: number }) => void | boolean }): Promise<void>
    serialize(options?: { attached?: string }): Buffer
    readonly open: boolean
    readonly inTransaction: boolean
    readonly name: string
    readonly memory: boolean
    readonly readonly: boolean
    readonly userVersion: number
  }

  export = Database
}

