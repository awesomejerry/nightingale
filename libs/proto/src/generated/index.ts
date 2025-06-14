// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.0
//   protoc               v6.31.1
// source: index.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import {
  type CallOptions,
  ChannelCredentials,
  Client,
  type ClientOptions,
  type ClientReadableStream,
  type ClientUnaryCall,
  type handleServerStreamingCall,
  type handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  type ServiceError,
  type UntypedServiceImplementation,
} from "@grpc/grpc-js";

export const protobufPackage = "nightingale";

export interface HelloRequest {
  name: string;
}

export interface HelloReply {
  message: string;
}

export interface HelloEventReply {
  message: string;
  /** Indicates the current processing step */
  step: string;
}

export interface SupervisorRequest {
  /** The task to be supervised */
  task: string;
  /** Additional context for the supervisor */
  context: string;
}

export interface SupervisorReply {
  /** The result of the supervision */
  result: string;
  /** Status of the operation (e.g., "completed", "failed", "in_progress") */
  status: string;
}

function createBaseHelloRequest(): HelloRequest {
  return { name: "" };
}

export const HelloRequest: MessageFns<HelloRequest> = {
  encode(message: HelloRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): HelloRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHelloRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HelloRequest {
    return { name: isSet(object.name) ? globalThis.String(object.name) : "" };
  },

  toJSON(message: HelloRequest): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<HelloRequest>, I>>(base?: I): HelloRequest {
    return HelloRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<HelloRequest>, I>>(object: I): HelloRequest {
    const message = createBaseHelloRequest();
    message.name = object.name ?? "";
    return message;
  },
};

function createBaseHelloReply(): HelloReply {
  return { message: "" };
}

export const HelloReply: MessageFns<HelloReply> = {
  encode(message: HelloReply, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.message !== "") {
      writer.uint32(10).string(message.message);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): HelloReply {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHelloReply();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.message = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HelloReply {
    return { message: isSet(object.message) ? globalThis.String(object.message) : "" };
  },

  toJSON(message: HelloReply): unknown {
    const obj: any = {};
    if (message.message !== "") {
      obj.message = message.message;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<HelloReply>, I>>(base?: I): HelloReply {
    return HelloReply.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<HelloReply>, I>>(object: I): HelloReply {
    const message = createBaseHelloReply();
    message.message = object.message ?? "";
    return message;
  },
};

function createBaseHelloEventReply(): HelloEventReply {
  return { message: "", step: "" };
}

export const HelloEventReply: MessageFns<HelloEventReply> = {
  encode(message: HelloEventReply, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.message !== "") {
      writer.uint32(10).string(message.message);
    }
    if (message.step !== "") {
      writer.uint32(18).string(message.step);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): HelloEventReply {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHelloEventReply();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.message = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.step = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HelloEventReply {
    return {
      message: isSet(object.message) ? globalThis.String(object.message) : "",
      step: isSet(object.step) ? globalThis.String(object.step) : "",
    };
  },

  toJSON(message: HelloEventReply): unknown {
    const obj: any = {};
    if (message.message !== "") {
      obj.message = message.message;
    }
    if (message.step !== "") {
      obj.step = message.step;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<HelloEventReply>, I>>(base?: I): HelloEventReply {
    return HelloEventReply.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<HelloEventReply>, I>>(object: I): HelloEventReply {
    const message = createBaseHelloEventReply();
    message.message = object.message ?? "";
    message.step = object.step ?? "";
    return message;
  },
};

function createBaseSupervisorRequest(): SupervisorRequest {
  return { task: "", context: "" };
}

export const SupervisorRequest: MessageFns<SupervisorRequest> = {
  encode(message: SupervisorRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.task !== "") {
      writer.uint32(10).string(message.task);
    }
    if (message.context !== "") {
      writer.uint32(18).string(message.context);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SupervisorRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSupervisorRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.task = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.context = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SupervisorRequest {
    return {
      task: isSet(object.task) ? globalThis.String(object.task) : "",
      context: isSet(object.context) ? globalThis.String(object.context) : "",
    };
  },

  toJSON(message: SupervisorRequest): unknown {
    const obj: any = {};
    if (message.task !== "") {
      obj.task = message.task;
    }
    if (message.context !== "") {
      obj.context = message.context;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SupervisorRequest>, I>>(base?: I): SupervisorRequest {
    return SupervisorRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SupervisorRequest>, I>>(object: I): SupervisorRequest {
    const message = createBaseSupervisorRequest();
    message.task = object.task ?? "";
    message.context = object.context ?? "";
    return message;
  },
};

function createBaseSupervisorReply(): SupervisorReply {
  return { result: "", status: "" };
}

export const SupervisorReply: MessageFns<SupervisorReply> = {
  encode(message: SupervisorReply, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.result !== "") {
      writer.uint32(10).string(message.result);
    }
    if (message.status !== "") {
      writer.uint32(18).string(message.status);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): SupervisorReply {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSupervisorReply();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.result = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.status = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SupervisorReply {
    return {
      result: isSet(object.result) ? globalThis.String(object.result) : "",
      status: isSet(object.status) ? globalThis.String(object.status) : "",
    };
  },

  toJSON(message: SupervisorReply): unknown {
    const obj: any = {};
    if (message.result !== "") {
      obj.result = message.result;
    }
    if (message.status !== "") {
      obj.status = message.status;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SupervisorReply>, I>>(base?: I): SupervisorReply {
    return SupervisorReply.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<SupervisorReply>, I>>(object: I): SupervisorReply {
    const message = createBaseSupervisorReply();
    message.result = object.result ?? "";
    message.status = object.status ?? "";
    return message;
  },
};

export type GreeterService = typeof GreeterService;
export const GreeterService = {
  sayHello: {
    path: "/nightingale.Greeter/SayHello",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: HelloRequest) => Buffer.from(HelloRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => HelloRequest.decode(value),
    responseSerialize: (value: HelloReply) => Buffer.from(HelloReply.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HelloReply.decode(value),
  },
  sayHelloStream: {
    path: "/nightingale.Greeter/SayHelloStream",
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: HelloRequest) => Buffer.from(HelloRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => HelloRequest.decode(value),
    responseSerialize: (value: HelloEventReply) => Buffer.from(HelloEventReply.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HelloEventReply.decode(value),
  },
  runSupervisor: {
    path: "/nightingale.Greeter/RunSupervisor",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SupervisorRequest) => Buffer.from(SupervisorRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SupervisorRequest.decode(value),
    responseSerialize: (value: SupervisorReply) => Buffer.from(SupervisorReply.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SupervisorReply.decode(value),
  },
} as const;

export interface GreeterServer extends UntypedServiceImplementation {
  sayHello: handleUnaryCall<HelloRequest, HelloReply>;
  sayHelloStream: handleServerStreamingCall<HelloRequest, HelloEventReply>;
  runSupervisor: handleUnaryCall<SupervisorRequest, SupervisorReply>;
}

export interface GreeterClient extends Client {
  sayHello(
    request: HelloRequest,
    callback: (error: ServiceError | null, response: HelloReply) => void,
  ): ClientUnaryCall;
  sayHello(
    request: HelloRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: HelloReply) => void,
  ): ClientUnaryCall;
  sayHello(
    request: HelloRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: HelloReply) => void,
  ): ClientUnaryCall;
  sayHelloStream(request: HelloRequest, options?: Partial<CallOptions>): ClientReadableStream<HelloEventReply>;
  sayHelloStream(
    request: HelloRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<HelloEventReply>;
  runSupervisor(
    request: SupervisorRequest,
    callback: (error: ServiceError | null, response: SupervisorReply) => void,
  ): ClientUnaryCall;
  runSupervisor(
    request: SupervisorRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SupervisorReply) => void,
  ): ClientUnaryCall;
  runSupervisor(
    request: SupervisorRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SupervisorReply) => void,
  ): ClientUnaryCall;
}

export const GreeterClient = makeGenericClientConstructor(GreeterService, "nightingale.Greeter") as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): GreeterClient;
  service: typeof GreeterService;
  serviceName: string;
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
  fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
