"""Definitions for CrewAI agents collaborating on document intelligence."""

from __future__ import annotations

from typing import Dict, List

from crewai import Agent, Crew, Process, Task

from ai_ml.providers.registry import LLMConfig, LLMProviderRegistry
from ai_ml.tools import DocumentSearchTool, InsightsExtractionTool


def build_document_crew(
    registry: LLMProviderRegistry,
    *,
    retriever_tool: DocumentSearchTool,
    insights_tool: InsightsExtractionTool,
    additional_context: Dict[str, str] | None = None,
) -> Crew:
    """Construct a collaborative CrewAI setup across multiple model providers."""

    context = additional_context or {}

    analyst_llm = registry.chat(LLMConfig(provider="openai", model=context.get("openai_model", "gpt-4o-mini"), temperature=0.15))
    researcher_llm = registry.chat(LLMConfig(provider="google", model=context.get("gemini_model", "gemini-1.5-pro"), temperature=0.2))
    reviewer_llm = registry.chat(LLMConfig(provider="anthropic", model=context.get("claude_model", "claude-3-5-sonnet-20241022"), temperature=0.15))

    analyst = Agent(
        name="Document Analyst",
        role="Lead summarizer responsible for holistic understanding of the document.",
        goal="Create a faithful synopsis and highlight the document's structure.",
        backstory=(
            "You are a meticulous consultant that reads business and research documents. "
            "You produce balanced and structured summaries that stay grounded in evidence."
        ),
        llm=analyst_llm,
        tools=[retriever_tool.to_langchain_tool(), insights_tool.to_langchain_tool()],
        verbose=False,
    )

    researcher = Agent(
        name="Cross-Referencer",
        role="Research agent verifying facts and surfacing deeper context.",
        goal="Validate claims by pulling direct citations from the source document.",
        backstory=(
            "You cross-check every statement with citations. You prefer quoting the document "
            "verbatim and pointing the analyst to missing perspectives or open questions."
        ),
        llm=researcher_llm,
        tools=[retriever_tool.to_langchain_tool()],
        verbose=False,
    )

    reviewer = Agent(
        name="Insights Curator",
        role="Executive reviewer turning findings into next-step guidance.",
        goal="Distill strategic recommendations and risks based on the collective findings.",
        backstory=(
            "You lead executive briefings, synthesizing research into actions. "
            "You also capture unresolved follow-up questions for product teams."
        ),
        llm=reviewer_llm,
        tools=[retriever_tool.to_langchain_tool(), insights_tool.to_langchain_tool()],
        verbose=False,
    )

    tasks: List[Task] = [
        Task(
            name="Draft Summary",
            description=(
                "Produce a structured summary (overview, key sections, metrics) using the document. "
                "Leverage semantic search when unsure about specific details."
            ),
            agent=analyst,
            expected_output="A markdown summary with headings and bullet points grounded in citations.",
        ),
        Task(
            name="Evidence Review",
            description=(
                "Review the analyst summary. Validate each major statement, adding supporting quotes "
                "or pointing out gaps. Highlight any inconsistencies or missing angles."
            ),
            agent=researcher,
            expected_output="A list of verified statements with citations and flagged uncertainties.",
        ),
        Task(
            name="Executive Insights",
            description=(
                "Translate the validated findings into actionable insights and recommended next steps. "
                "Summarize risks, opportunities, and open questions for stakeholders."
            ),
            agent=reviewer,
            expected_output="Executive-ready bullet list of actions, risks, and follow-ups.",
        ),
    ]

    crew = Crew(agents=[analyst, researcher, reviewer], tasks=tasks, process=Process.sequential, verbose=False)
    return crew
