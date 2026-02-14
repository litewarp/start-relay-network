/**
 * @generated SignedSource<<1c95bb30dd24e9d5e11143850c152cb1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ConcreteRequest } from 'relay-runtime';
export type routesIndexQuery$variables = Record<PropertyKey, never>;
export type routesIndexQuery$data = {
  readonly id: string;
};
export type routesIndexQuery = {
  response: routesIndexQuery$data;
  variables: routesIndexQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "id",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "routesIndexQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "routesIndexQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "a596925b462b43c257e0a23c6e5346a5",
    "id": null,
    "metadata": {},
    "name": "routesIndexQuery",
    "operationKind": "query",
    "text": "query routesIndexQuery {\n  id\n}\n"
  }
};
})();

(node as any).hash = "594cc6ead4eac7b63c1c2d1a97ea5b10";

export default node;
