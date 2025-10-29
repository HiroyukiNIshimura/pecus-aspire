# SetTagsToItemRequest

Request DTO for setting all tags on a workspace item

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tagNames** | **Array&lt;string&gt;** | List of tag names to set on the item. Replaces all existing tags.  Tags will be auto-created in the organization if they don\&#39;t exist.  Empty list or null will remove all tags. | [optional] [default to undefined]

## Example

```typescript
import { SetTagsToItemRequest } from './api';

const instance: SetTagsToItemRequest = {
    tagNames,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
