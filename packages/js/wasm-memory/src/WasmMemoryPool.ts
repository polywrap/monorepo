/*
Future:
  - Garbage Collector
  - Acquire Priority

Architecture:
  - WasmPackage
    - has: WasmMemoryPool
    - tracks: WasmWrapper instances
    - destroys: WasmMemoryPool
    - gives: WasmMemory -> WasmWrapper
*/

export interface PoolHandle {
  memory: WebAssembly.Memory;
  id: number;
}

export interface PoolCacheEntry {
  memory: WebAssembly.Memory;
  dirty: boolean;
}

export interface PoolConfig {
  memoryConfig: WebAssembly.MemoryDescriptor;
  max: number;
  min: number;
  sleepMs: number;
}

export class WasmMemoryPool {
  protected _cache: Record<number, PoolCacheEntry> = { };
  protected _aliveCounter: number;
  protected _freeList: number[];

  constructor(
    protected _config: PoolConfig
  ) {
    const { max, min } = this._config;

    if (max < 1) {
      this._config.max = 1;
    }
    if (min < 0) {
      this._config.min = 0;
    }
    if (min > max) {
      this._config.min = this._config.max;
    }

    for (let i = 0; i < this._config.min; ++i) {
      this.acquire().then(
        (handle) => this.release(handle)
      );
    }
  }

  async acquire(): Promise<PoolHandle> {
    if (this._aliveCounter >= this._config.max) {
      // wait to acquire
      while (this._aliveCounter >= this._config.max) {
        await new Promise((resolve) =>
          setTimeout(resolve, this._config.sleepMs)
        );
      }
    }

    this._aliveCounter += 1;
    let id;

    if (this._freeList.length > 0) {
      id = this._freeList.pop() as number;
    } else {
      id = this._aliveCounter;
    }

    let memory: WebAssembly.Memory;

    if (this._cache[id]) {
      if (this._cache[id].dirty) {
        this._cleanEntry(id);
      }
      memory = this._cache[id].memory;
    } else {
      memory = new WebAssembly.Memory(
        this._config.memoryConfig
      );
    }

    const handle = {
      id,
      memory
    };

    this._cache[handle.id] = {
      dirty: false,
      memory: handle.memory
    };

    return handle;
  }

  release(handle: PoolHandle) {
    if (this._cache[handle.id] === undefined) {
      return;
    }

    this._cache[handle.id].dirty = true;
    this._freeList.push(handle.id);
    this._aliveCounter -= 1;
  }

  destroy(handle: Pick<PoolHandle, "id">) {
    if (this._cache[handle.id] === undefined) {
      return;
    }

    delete this._cache[handle.id];
    this._aliveCounter -= 1;
    this._freeList = this._freeList.filter(
      (x) => x !+= handle.id
    );
  }

  flush() {
    for (const id of Object.keys(this._cache)) {
      this.destroy({ id: Number.parseInt(id) });
    }
  }

  private _cleanEntry(id: number) {
    this._cache[id].dirty = false;
    new Uint8Array(
      this._cache[id].memory.buffer
    ).fill(0);
  }
}
