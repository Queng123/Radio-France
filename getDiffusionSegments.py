#!/usr/bin/env python3
from python_graphql_client import GraphqlClient
import sys

headers = { "x-token": "YOUR_OPENAPI_KEY" }

client = GraphqlClient(endpoint="https://openapi.radiofrance.fr/v1/graphql", headers=headers)

query = """
    query segmentsByShowUrl($showUrl: String!) {
        showByUrl(
            url: $showUrl
        ) {
            diffusionsConnection {
            edges {
                node {
                    url
                    transcript {
                        segments {
                            start
                            text
                            type
                        }
                    }
                }
            }
            }
        }
    }
"""

variables = { "showUrl": None }

if __name__ == '__main__':
    if len(sys.argv) > 3 or len(sys.argv) < 2:
        print(f"Usages:\n\t{sys.argv[0]} <ShowPath> <DiffusionID>\n\t{sys.argv[0]} <DiffusionURL>")
        print()
        print(f"Examples:\n\t{sys.argv[0]} franceculture/podcasts/fictions-theatre-et-cie 5557548\n\t{sys.argv[0]} https://www.radiofrance.fr/franceculture/podcasts/fictions-theatre-et-cie/gainsbourg-poete-majeur-5557548")
        exit(1)
    if len(sys.argv) == 2:
        variables['showUrl'] = "/".join(sys.argv[1].split("/")[:-1])
        diffusionID = sys.argv[1].split('-')[-1]
    else:
        variables['showUrl'] = "https://www.radiofrance.fr/" + sys.argv[1]
        diffusionID = sys.argv[2]
    nodes = []

    try:
        data = client.execute(query=query, variables=variables)
    except Exception as e:
        print(e)
        exit(1)
    if not data['data']['showByUrl']:
        print('No show found for this URL')
        exit(1)
    for node in data['data']['showByUrl']['diffusionsConnection']['edges']:
        nodes.append(node['node'])
    for node in nodes:
        if node['url']:
            node['diffusionID'] = node['url'].split('-')[-1]
        else:
            node['diffusionID'] = '0'
    for node in nodes:
        if node['diffusionID'] == diffusionID:
            if not node['transcript']:
                print('No transcript found for this diffusion')
                exit(1)
            for segment in node['transcript']['segments']:
                print(segment['text'])
            exit(0)
    print('No diffusion found for this URL')
    exit(1)
