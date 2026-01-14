"""
Model Configuration Utilities
==============================

Shared utilities for reading and parsing model configuration from environment variables.
Used by both commit_message.py and merge resolver.
"""

import logging
import os

from phase_config import resolve_model_id

logger = logging.getLogger(__name__)

DEFAULT_UTILITY_MODEL_SHORTHAND = "haiku"


def get_utility_model_config(
    default_model_shorthand: str = DEFAULT_UTILITY_MODEL_SHORTHAND,
) -> tuple[str, int | None]:
    """
    Get utility model configuration from environment variables.

    Reads UTILITY_MODEL_ID and UTILITY_THINKING_BUDGET from environment,
    with sensible defaults and validation.

    When CLAUDE_CODE_USE_BEDROCK=1, automatically resolves model shorthands
    (haiku, sonnet, opus) to Bedrock model IDs.

    Args:
        default_model_shorthand: Default model shorthand (haiku, sonnet, opus)
                                 to use if UTILITY_MODEL_ID not set

    Returns:
        Tuple of (model_id, thinking_budget) where thinking_budget is None
        if extended thinking is disabled, or an int representing token budget
    """
    model_raw = os.environ.get("UTILITY_MODEL_ID", default_model_shorthand)
    model = resolve_model_id(model_raw)
    thinking_budget_str = os.environ.get("UTILITY_THINKING_BUDGET", "")

    # Parse thinking budget: empty string = disabled (None), number = budget tokens
    # Note: 0 is treated as "disable thinking" (same as None) since 0 tokens is meaningless
    thinking_budget: int | None
    if not thinking_budget_str:
        # Empty string means "none" level - disable extended thinking
        thinking_budget = None
    else:
        try:
            parsed_budget = int(thinking_budget_str)
            # Validate positive values - 0 or negative are invalid
            # 0 would mean "thinking enabled but 0 tokens" which is meaningless
            if parsed_budget <= 0:
                if parsed_budget == 0:
                    # Zero means disable thinking (same as empty string)
                    logger.debug(
                        "UTILITY_THINKING_BUDGET=0 interpreted as 'disable thinking'"
                    )
                    thinking_budget = None
                else:
                    logger.warning(
                        f"Negative UTILITY_THINKING_BUDGET value '{thinking_budget_str}' not allowed, using default 1024"
                    )
                    thinking_budget = 1024
            else:
                thinking_budget = parsed_budget
        except ValueError:
            logger.warning(
                f"Invalid UTILITY_THINKING_BUDGET value '{thinking_budget_str}', using default 1024"
            )
            thinking_budget = 1024

    return model, thinking_budget
