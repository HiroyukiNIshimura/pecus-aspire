---
name: flyonui
description: 'Expert guidance for building semantic Tailwind CSS UI components using FlyonUI. Use when implementing UI components, styling with Tailwind CSS, integrating interactive plugins, leveraging semantic CSS classes, or building responsive layouts. Supports component customization, theme integration, and accessibility best practices.'
---

# FlyonUI Skill

Master the FlyonUI component library for building modern, accessible web interfaces with semantic Tailwind CSS.

## When to Use This Skill

- **Building UI Components**: Implementing FlyonUI buttons, forms, modals, cards, tables, and other UI elements
- **Styling & Customization**: Applying semantic classes, using Tailwind CSS variants, customizing themes
- **Interactive Features**: Adding JavaScript plugin behavior (dropdowns, tooltips, carousels, etc.)
- **Component Documentation**: Understanding FlyonUI component APIs, props, and usage patterns
- **Accessibility & Responsiveness**: Implementing accessible and mobile-friendly components
- **Integration & Setup**: Configuring FlyonUI in Next.js, React, or other projects
- **Best Practices**: Following FlyonUI conventions for maintainability and performance

## Prerequisites

- Working knowledge of Tailwind CSS fundamentals
- Understanding of semantic HTML and accessibility (WCAG)
- Familiarity with the project's UI guidelines and design system
- React/Next.js setup with Tailwind CSS configured
- Understanding of how to use MCP tools to query documentation

## Step-by-Step Workflows

### Workflow 1: Querying FlyonUI Documentation via Context7

When faced with FlyonUI-related questions, use the MCP Context7 `query-docs` tool to retrieve authoritative documentation:

```
Library ID: /llmstxt/flyonui_llms_txt (Most comprehensive: 7937 code snippets)
Alternative: /themeselection/flyonui-docs (1651 snippets, official docs)

Example queries:
- "button component examples and props"
- "form input styling and validation"
- "modal/dialog component usage"
- "dropdown plugin implementation"
- "table component with sorting and pagination"
- "responsive grid and layout patterns"
```

**Implementation Tip**: Always call `mcp_context7_query-docs` with specific component or feature names to get precise code examples and best practices.

### Workflow 2: Implementing a FlyonUI Component

1. **Identify the component**: Determine which FlyonUI component matches the UI requirement
   - Common components: Button, Input, Select, Modal, Card, Table, Toast, Navbar

2. **Query documentation**: Use Context7 to retrieve component documentation
   ```javascript
   // Example: Query for button component
   // Use: mcp_context7_query-docs with /llmstxt/flyonui_llms_txt
   // Query: "button component types, sizes, states, and examples"
   ```

3. **Extract semantic classes**: Identify the semantic class structure
   - FlyonUI uses semantic naming: `.btn`, `.form-control`, `.modal`, etc.
   - Combine with Tailwind utilities for extended customization

4. **Apply accessibility attributes**: Ensure proper HTML structure
   - Use semantic HTML elements
   - Add ARIA labels and roles where needed
   - Test keyboard navigation

5. **Customize for project**: Adapt to project's design tokens
   - Override with Tailwind arbitrary values if needed
   - Maintain consistency with `docs/tailwind-arbitrary-values.md`

### Workflow 3: Adding Interactive Plugin Behavior

1. **Check JavaScript plugin support**: Not all FlyonUI components require JS plugins
2. **Import required script**: Ensure FlyonUI JS is loaded in the project
   ```css
   @source "./node_modules/flyonui/dist/index.js";
   ```

3. **Initialize plugin**: Most plugins auto-initialize with data attributes
   ```html
   <!-- Example: Dropdown with auto-init -->
   <button class="btn" data-flyonui-trigger="dropdown">
     Menu
   </button>
   ```

4. **Configure plugin options**: Use data attributes or JavaScript API
5. **Test interactions**: Verify working on desktop and mobile

### Workflow 4: Styling & Customization

**Semantic Class Approach**:
```html
<!-- Use semantic classes as base -->
<button class="btn btn-primary">Primary Button</button>

<!-- Extend with Tailwind utilities -->
<button class="btn btn-primary w-full md:w-auto">Responsive Button</button>
```

**Arbitrary Values** (when needed):
- Reference `docs/tailwind-arbitrary-values.md` for project conventions
- Use arbitrary values for one-off customizations only
- Prefer extending theme config for reusable styles

**Theme Colors**:
- Align with FlyonUI's semantic color system (`-primary`, `-secondary`, `-success`, `-danger`, etc.)
- Check project's color definitions in Tailwind config

## Common FlyonUI Components

| Component | Use Case | Key Classes |
|-----------|----------|------------|
| **Button** | Primary action triggers | `.btn`, `.btn-primary`, `.btn-outline` |
| **Input/Form** | Text entry, validation | `.form-control`, `.form-group`, `.input` |
| **Select** | Dropdown selection | `.select`, `.select-bordered` |
| **Modal/Dialog** | Modal windows, confirmations | `.modal`, `.modal-box`, `.modal-action` |
| **Card** | Content containers | `.card`, `.card-body`, `.card-compact` |
| **Table** | Data display | `.table`, `.table-zebra`, `.table-compact` |
| **Toast/Alert** | Notifications | `.toast`, `.alert`, `.alert-info` |
| **Navbar** | Navigation header | `.navbar`, `.navbar-start`, `.navbar-end` |
| **Dropdown** | Context menus | `.dropdown`, `[data-flyonui-trigger="dropdown"]` |
| **Tooltip** | Hover hints | `.tooltip`, `[data-flyonui-trigger="tooltip"]` |

## Best Practices

### 1. Semantic Classes First
Always start with FlyonUI semantic classes, then extend with Tailwind utilities:
```html
<!-- Good: Semantic + utilities -->
<button class="btn btn-primary md:w-full">Save</button>

<!-- Avoid: Rebuilding with pure utilities -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
```

### 2. Accessibility Compliance
- Always use proper semantic HTML (`<button>`, `<input>`, `<label>`)
- Add `for` attributes on labels, `id` on form fields
- Include ARIA attributes: `aria-label`, `aria-live`, `role`
- Ensure color contrast meets WCAG AA standards
- Reference `docs/frontend-guidelines.md` for project standards

### 3. Responsive Design
- Use Tailwind responsive prefixes: `md:`, `lg:`, `xl:`
- Test on mobile, tablet, desktop viewports
- Avoid fixed widths; prefer flexible layouts
- Reference `docs/layout-template.md` for layout patterns

### 4. Theme Consistency
- Use project-defined colors via Tailwind theme config
- Avoid hardcoded color values
- Maintain semantic color meanings (`-primary`, `-success`, `-warning`, `-danger`)
- Check FlyonUI color conventions in `docs/Flyonui-color.md`

### 5. Performance
- Lazy-load heavy components (modals, dropdowns)
- Minimize CSS bloat: only import needed FlyonUI components
- Use Next.js dynamic imports for large component trees
- Avoid unnecessary plugin initialization for unused interactive features

## Troubleshooting

### Issue: Component styles not appearing
**Solution**:
- Verify FlyonUI CSS is imported in main style file
- Check that Tailwind CSS is configured correctly
- Ensure `@plugin "flyonui"` is in CSS imports
- Clear build cache: `npm run build`

### Issue: JavaScript plugin not initializing
**Solution**:
- Confirm FlyonUI JS source is included: `@source "./node_modules/flyonui/dist/index.js"`
- Check browser console for errors
- Verify data attributes are spelled correctly
- Ensure script loads after DOM is ready (Next.js handles this)

### Issue: Styling conflicts or custom styles not working
**Solution**:
- Use Tailwind arbitrary values with proper specificity
- Check CSS specificity; semantic classes override utilities
- Reference `docs/tailwind-arbitrary-values.md` for correct syntax
- Avoid `!important` unless absolutely necessary (indicate in comments)

### Issue: Component doesn't look right on mobile
**Solution**:
- Add responsive class prefixes: `md:`, `lg:`, `xl:`
- Test with Chrome DevTools device emulation
- Reference `docs/layout-template.md` for responsive patterns
- Check that parent containers have proper flex/grid configuration

## References & Resources

### Project Documentation
- [Layout Template Guidelines](../../../docs/layout-template.md) — Proper structure for page layouts
- [Tailwind Arbitrary Values](../../../docs/tailwind-arbitrary-values.md) — When/how to use arbitrary values
- [Frontend Guidelines](../../../docs/frontend-guidelines.md) — Code style and best practices
- [UI Component Guidelines](../../../docs/ui-component-guidelines.md) — Component architecture patterns
- [FlyonUI Color System](../../../docs/Flyonui-color.md) — Color naming conventions

### External Resources
- [FlyonUI Official Docs](https://flyonui.com) — Component library documentation
- [FlyonUI GitHub](https://github.com/themeselection/flyonui) — Source code and issues
- [Tailwind CSS Docs](https://tailwindcss.com) — CSS framework reference
- [FlyonUI Discord](https://discord.com/invite/kBHkY7DekX) — Community support

## Using Context7 to Query FlyonUI Docs

When you need detailed information about FlyonUI:

```
Tool: mcp_context7_query-docs
Library ID: /llmstxt/flyonui_llms_txt
Query examples:
  - "button component all variants and props"
  - "modal dialog with form integration"
  - "table component with sorting and filtering"
  - "form validation patterns and error states"
  - "dropdown menu with icons and separators"
  - "responsive navbar with mobile menu"
  - "toast notification patterns and examples"
```

The Context7 library provides comprehensive, up-to-date FlyonUI documentation with thousands of code examples, making it the authoritative reference for implementation details.

---

**Version**: 2.4+
**Last Updated**: 2026-02-11
**Maintainer**: Pecus Aspire Team
