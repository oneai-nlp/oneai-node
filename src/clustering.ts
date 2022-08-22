import axios from 'axios';

const baseURL = 'https://staging.oneai.com/clustering/v1/collections';

function GET(path: string, apiKey: string) {
  return axios({
    method: 'GET',
    url: `${baseURL}/${path}`,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });
}

function POST(path: string, apiKey: string, data: object) {
  return axios({
    method: 'POST',
    url: `${baseURL}/${path}`,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    data,
  });
}

interface Item {
  id: number,
  text: string,
  createdAt: Date,
  distance: number,
  phrase: Phrase,
  cluster: Cluster
}

class Phrase {
  id: number;

  text: string;

  itemCount: number;

  cluster: Cluster;

  collection: Collection;

  constructor(
    id: number,
    text: string,
    itemCount: number,
    cluster: Cluster,
    collection: Collection,
  ) {
    this.id = id;
    this.text = text;
    this.itemCount = itemCount;
    this.cluster = cluster;
    this.collection = collection;
  }

  async items(): Promise<Item[]> {
    return GET(`phrases/${this.id}/items`, this.collection.apiKey).then((items) => items.data.map((item: any) => ({
      id: item.id,
      text: item.original_text,
      createdAt: new Date(item.created_at),
      distance: item.distance_to_phrase,
      phrase: this,
      cluster: this.cluster,
    })));
  }
}

class Cluster {
  id: number;

  text: string;

  phraseCount: number;

  metadata: string;

  collection: Collection;

  private phrasesCache: Phrase[];

  constructor(
    id: number,
    text: string,
    phraseCount: number,
    metadata: string,
    collection: Collection,
    phrases: any[],
  ) {
    this.id = id;
    this.text = text;
    this.phraseCount = phraseCount;
    this.metadata = metadata;
    this.collection = collection;
    this.phrasesCache = phrases.map((phrase) => new Phrase(
      phrase.phrase_id,
      phrase.text,
      phrase.items_count,
      this,
      collection,
    ));
  }

  async phrases(): Promise<Phrase[]> {
    return this.phrasesCache;
  }
}

class Collection {
  name: string;

  apiKey: string;

  constructor(name: string, apiKey: string) {
    this.name = name;
    this.apiKey = apiKey;
  }

  async clusters(): Promise<Cluster[]> {
    return GET(`${this.name}/clusters`, this.apiKey).then((clusters) => clusters.data.map((cluster: any) => new Cluster(cluster.cluster_id, cluster.cluster_phrase, cluster.phrases_count, cluster.metadata, this, cluster.phrases)));
  }
}

async function fetchCollections(apiKey: string) {
  return GET('collections', apiKey).then((collections) => collections.data.map((collection: any) => new Collection(collection.name, apiKey)));
}

// @dataclass
// class Cluster:
//     id: int
//     text: str
//     phrase_count: int
//     metadata: str
//     collection: "Collection" = field(repr=False)
//     _phrases: List[Phrase] = field(default_factory=list, repr=False)

//     @property
//     def phrases(self) -> List[Phrase]:
//         # refetch? cache?
//         return self._phrases

//     def add_items(self, *items: str):
//         url = f"{self.collection.name}/items"
//         data = [
//             {
//                 "text": item,
//                 "force-cluster-id": self.id,
//             }
//             for item in items
//         ]
//         _post_req(url, data, self.collection.api_key)

//     @classmethod
//     def from_dict(cls, collection: "Collection", object: dict) -> "Cluster":
//         cluster = cls(
//             id=object["cluster_id"],
//             text=object["cluster_phrase"],
//             phrase_count=object["phrases_count"],
//             metadata=object["metadata"],
//             collection=collection,
//         )
//         cluster._phrases = [
//             Phrase.from_dict(cluster, phrase) for phrase in object["phrases"]
//         ]
//         return cluster

// class Collection:
//     def __init__(self, name: str, api_key: str = None):
//         self.name = name
//         self.api_key = api_key

//     @property
//     def clusters(self) -> List[Cluster]:
//         # generator w pagination? caching?
//         url = f"{self.name}/clusters"
//         return [
//             Cluster.from_dict(self, cluster) for cluster in _get_req(url, self.api_key)
//         ]

//     @property
//     def find(self) -> List[Cluster]:
//         url = f"{self.name}/clusters/find"
//         return [
//             Cluster.from_dict(self, cluster) for cluster in _get_req(url, self.api_key)
//         ]

//     def add_items(self, *items: str, force_new_cluster: bool = False):
//         url = f"{self.name}/items"
//         data = [
//             {
//                 "text": item,
//                 "force-new-cluster": force_new_cluster,
//             }
//             for item in items
//         ]
//         _post_req(url, data, self.api_key)

//     def __repr__(self) -> str:
//         return f"oneai.Collection({self.name})"
