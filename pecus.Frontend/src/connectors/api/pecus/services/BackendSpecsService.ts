/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class BackendSpecsService {
  /**
   * OpenAPIスキーマ取得
   * Swagger UIで生成されたOpenAPI 3.0スキーマをJSON形式で取得します。
   * @returns string OK
   * @throws ApiError
   */
  public static getApiBackendSpecsOpenapi(): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/specs/openapi",
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * OpenAPIスキーマ取得
   * Swagger UIで生成されたOpenAPI 3.0スキーマをJSON形式で取得します。
   * @param documentName ドキュメント名（デフォルト: v1）
   * @returns string OK
   * @throws ApiError
   */
  public static getApiBackendSpecsOpenapi1(
    documentName: string = "v1",
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/specs/openapi/{documentName}",
      path: {
        documentName: documentName,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * OpenAPIスキーマ取得（YAML形式）
   * Swagger UIで生成されたOpenAPI 3.0スキーマをYAML形式で取得します。
   * @returns string OK
   * @throws ApiError
   */
  public static getApiBackendSpecsOpenapiYaml(): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/specs/openapi.yaml",
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
  /**
   * OpenAPIスキーマ取得（YAML形式）
   * Swagger UIで生成されたOpenAPI 3.0スキーマをYAML形式で取得します。
   * @param documentName ドキュメント名（デフォルト: v1）
   * @returns string OK
   * @throws ApiError
   */
  public static getApiBackendSpecsOpenapiYaml1(
    documentName: string = "v1",
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/backend/specs/openapi/{documentName}.yaml",
      path: {
        documentName: documentName,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
}
