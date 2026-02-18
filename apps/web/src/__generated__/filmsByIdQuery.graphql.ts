/**
 * @generated SignedSource<<626c064a1ece5304eee7e8f832148fc0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ConcreteRequest } from 'relay-runtime';
export type filmsByIdQuery$variables = {
  id: string;
};
export type filmsByIdQuery$data = {
  readonly film: {
    readonly id: string;
    readonly title: string;
  } | null | undefined;
};
export type filmsByIdQuery = {
  response: filmsByIdQuery$data;
  variables: filmsByIdQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "Film",
    "kind": "LinkedField",
    "name": "film",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "title",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "filmsByIdQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "filmsByIdQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "98c94bd8c92e65a460838108b14e78f9",
    "id": null,
    "metadata": {},
    "name": "filmsByIdQuery",
    "operationKind": "query",
    "text": "query filmsByIdQuery(\n  $id: ID!\n) {\n  film(id: $id) {\n    id\n    title\n  }\n}\n"
  }
};
})();

(node as any).hash = "bd050a9f434a3237ee19681be391f9b3";

export default node;
