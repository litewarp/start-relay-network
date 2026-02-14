/**
 * @generated SignedSource<<4d4cd2b2447ded2845f0c23546dfce24>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ConcreteRequest } from 'relay-runtime';
export type routesIndexQuery$variables = Record<PropertyKey, never>;
export type routesIndexQuery$data = {
  readonly films: {
    readonly edges: ReadonlyArray<{
      readonly cursor: any | null | undefined;
      readonly node: {
        readonly id: string;
        readonly title: string;
      } | null | undefined;
    } | null | undefined>;
    readonly totalCount: number;
  } | null | undefined;
};
export type routesIndexQuery = {
  response: routesIndexQuery$data;
  variables: routesIndexQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Literal",
        "name": "first",
        "value": 10
      }
    ],
    "concreteType": "FilmConnection",
    "kind": "LinkedField",
    "name": "films",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "totalCount",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "FilmEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "cursor",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Film",
            "kind": "LinkedField",
            "name": "node",
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
        ],
        "storageKey": null
      }
    ],
    "storageKey": "films(first:10)"
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
    "cacheID": "3a29344fa1914b035421191e3307c23d",
    "id": null,
    "metadata": {},
    "name": "routesIndexQuery",
    "operationKind": "query",
    "text": "query routesIndexQuery {\n  films(first: 10) {\n    totalCount\n    edges {\n      cursor\n      node {\n        id\n        title\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "364040f54d82be4f696f23e8910773d8";

export default node;
