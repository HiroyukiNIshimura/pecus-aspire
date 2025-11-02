/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request DTO for setting all tags on a workspace item
 */
export type SetTagsToItemRequest = {
  /**
   * List of tag names to set on the item. Replaces all existing tags.
   * Tags will be auto-created in the organization if they don't exist.
   * Empty list or null will remove all tags.
   */
  tagNames?: Array<string> | null;
};
