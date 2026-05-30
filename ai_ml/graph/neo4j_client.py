"""Neo4j helper used to persist DocuThinker insights into a knowledge graph."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

try:
    from neo4j import GraphDatabase
except ImportError:  # pragma: no cover - optional dependency
    GraphDatabase = None  # type: ignore


class Neo4jNotConfigured(RuntimeError):
    """Raised when the Neo4j integration is not available or configured."""


@dataclass(frozen=True)
class Neo4jConfig:
    uri: str
    user: str
    password: str
    database: Optional[str] = None


class Neo4jGraphClient:
    """Lightweight wrapper around the Neo4j Python driver."""

    def __init__(self, config: Neo4jConfig) -> None:
        if GraphDatabase is None:
            raise Neo4jNotConfigured(
                "neo4j driver is not installed. Install the 'neo4j' pip package to enable the knowledge graph."
            )
        if not config.uri or not config.user or not config.password:
            raise Neo4jNotConfigured("Neo4j credentials are incomplete. Set URI, user, and password.")
        self._config = config
        self._driver = GraphDatabase.driver(config.uri, auth=(config.user, config.password))

    # ------------------------------------------------------------------
    # Core operations

    def upsert_document(
        self,
        *,
        document_id: str,
        title: Optional[str],
        summary: Optional[str],
        topics: Iterable[str],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Create or update a document node and link topic nodes."""

        meta = metadata or {}

        def _write(tx):
            tx.run(
                """
                MERGE (d:Document {id: $document_id})
                SET d.title = COALESCE($title, d.title),
                    d.summary = COALESCE($summary, d.summary),
                    d.updated_at = timestamp(),
                    d.metadata = $metadata
                """,
                document_id=document_id,
                title=title,
                summary=summary,
                metadata=meta,
            )
            for raw_topic in topics:
                topic = raw_topic.strip()
                if not topic:
                    continue
                tx.run(
                    """
                    MERGE (t:Topic {name: $topic})
                    MERGE (d:Document {id: $document_id})-[:COVERS]->(t)
                    """,
                    topic=topic,
                    document_id=document_id,
                )

        self._execute_write(_write)

    def create_relationship(self, source_id: str, target_id: str, rel_type: str, properties: Optional[Dict[str, Any]] = None) -> None:
        """Create an arbitrary relationship between two document nodes."""

        props = properties or {}

        def _write(tx):
            tx.run(
                """
                MATCH (s:Document {id: $source_id}), (t:Document {id: $target_id})
                MERGE (s)-[r:%s]->(t)
                SET r += $props,
                    r.updated_at = timestamp()
                """
                % rel_type,
                source_id=source_id,
                target_id=target_id,
                props=props,
            )

        self._execute_write(_write)

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute arbitrary Cypher and return a list of dictionaries."""

        params = parameters or {}

        def _read(tx):
            result = tx.run(query, **params)
            return [record.data() for record in result]

        return self._execute_read(_read)

    # ------------------------------------------------------------------
    # Driver helpers

    def close(self) -> None:
        self._driver.close()

    def _execute_write(self, func):
        with self._driver.session(database=self._config.database) as session:
            session.execute_write(func)

    def _execute_read(self, func):
        with self._driver.session(database=self._config.database) as session:
            return session.execute_read(func)


__all__ = ["Neo4jGraphClient", "Neo4jNotConfigured", "Neo4jConfig"]
