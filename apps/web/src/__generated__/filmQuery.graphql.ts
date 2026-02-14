/**
 * @generated SignedSource<<13bbdc008fbdabc9d63daa35ba60fa66>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ConcreteRequest } from 'relay-runtime';
import type { FragmentRefs } from "relay-runtime";
export type filmQuery$variables = {
  id: string;
};
export type filmQuery$data = {
  readonly filmById: {
    readonly id: string;
    readonly title: string;
    readonly " $fragmentSpreads": FragmentRefs<"filmFragment_planets">;
  };
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
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "filmQuery",
    "selections": [
      {
        "kind": "RequiredField",
        "field": {
          "alias": null,
          "args": (v1/*: any*/),
          "concreteType": "Film",
          "kind": "LinkedField",
          "name": "filmById",
          "plural": false,
          "selections": [
            (v2/*: any*/),
            (v3/*: any*/),
            {
              "kind": "Defer",
              "selections": [
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "filmFragment_planets"
                }
              ]
            }
          ],
          "storageKey": null
        },
        "action": "THROW"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "filmQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Film",
        "kind": "LinkedField",
        "name": "filmById",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          {
            "if": null,
            "kind": "Defer",
            "label": "filmQuery$defer$filmFragment_planets",
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "FilmPlanetConnection",
                "kind": "LinkedField",
                "name": "filmPlanets",
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
                    "concreteType": "FilmPlanetEdge",
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
                        "concreteType": "FilmPlanet",
                        "kind": "LinkedField",
                        "name": "node",
                        "plural": false,
                        "selections": [
                          {
                            "alias": null,
                            "args": null,
                            "concreteType": "Planet",
                            "kind": "LinkedField",
                            "name": "planet",
                            "plural": false,
                            "selections": [
                              {
                                "alias": null,
                                "args": null,
                                "kind": "ScalarField",
                                "name": "name",
                                "storageKey": null
                              },
                              (v2/*: any*/)
                            ],
                            "storageKey": null
                          },
                          (v2/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ]
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "a5dcb507eabbe662ca4228fc2b9c82c6",
    "id": null,
    "metadata": {},
    "name": "filmQuery",
    "operationKind": "query",
    "text": "query filmQuery(\n  $id: ID!\n) {\n  filmById(id: $id) {\n    id\n    title\n    ...filmFragment_planets @defer(label: \"filmQuery$defer$filmFragment_planets\")\n  }\n}\n\nfragment filmFragment_planets on Film {\n  filmPlanets {\n    totalCount\n    edges {\n      cursor\n      node {\n        planet {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9292e820ad7749b1637e96ea9dc57272";

export default node;
