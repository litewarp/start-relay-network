/**
 * @generated SignedSource<<ae775714b164b3789fd087762d8e74a2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import type { ReaderFragment } from 'relay-runtime';
import type { FragmentRefs } from "relay-runtime";
export type filmFragment_planets$data = {
  readonly filmPlanets: {
    readonly edges: ReadonlyArray<{
      readonly cursor: any | null | undefined;
      readonly node: {
        readonly planet: {
          readonly name: string;
        } | null | undefined;
      } | null | undefined;
    } | null | undefined>;
    readonly totalCount: number;
  };
  readonly " $fragmentType": "filmFragment_planets";
};
export type filmFragment_planets$key = {
  readonly " $data"?: filmFragment_planets$data;
  readonly " $fragmentSpreads": FragmentRefs<"filmFragment_planets">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "filmFragment_planets",
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
                    }
                  ],
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Film",
  "abstractKey": null
};

(node as any).hash = "3af9b8efcfc2a4ccbaf9a187c634951e";

export default node;
