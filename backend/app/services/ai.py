"""AI: interpret answers and write daily/weekly reports.

The AI model is NOT chosen yet (see DECISIONS.md). Keep every call to the model inside
this module so the provider can be picked or swapped without touching the routers.
Prompts live in app/prompts/*.md. Model output must be JSON validated with app.schemas.
"""
