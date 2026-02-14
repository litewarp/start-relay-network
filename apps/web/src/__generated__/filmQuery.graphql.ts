/**
 * @generated SignedSource<<89598f86c5f520f5f02643ef8eb4481c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ConcreteRequest } from 'relay-runtime';
export type filmQuery$variables = {
  id: string;
};
export type filmQuery$data = {
  readonly filmById: {
    readonly id: string;
    readonly title: string;
  } | null | undefined;
};
export type filmQuery = {
  response: filmQuery$data;
  variables: filmQuery$variables;
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
    "name": "filmById",
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
    "name": "filmQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "filmQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "702b511c827a2dd0764bc47d6b4382db",
    "id": null,
    "metadata": {},
    "name": "filmQuery",
    "operationKind": "query",
    "text": "query filmQuery(\n  $id: ID!\n) {\n  filmById(id: $id) {\n    id\n    title\n  }\n}\n"
  }
};
})();

(node as any).hash = "c6ac4811da514f899b0abbdb98632d75";

export default node;
