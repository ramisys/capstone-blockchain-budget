import { describe, it, expect } from 'vitest';
import { AxiosHeaders } from 'axios';
import apiClient from '../axios';

/**
 * Regression guard: the client must not declare a default `Content-Type`.
 *
 * Axios serializes a FormData body to JSON whenever the request already carries
 * an `application/json` content type, which strips the File out of multipart
 * uploads and makes the server answer "A file is required".
 */
describe('apiClient defaults', () => {
  const transformRequest = (data: unknown, headerOverrides: Record<string, string> = {}) => {
    const headers = new AxiosHeaders({ ...apiClient.defaults.headers.common, ...headerOverrides });
    const [transform] = apiClient.defaults.transformRequest as Array<
      (this: unknown, data: unknown, headers: AxiosHeaders) => unknown
    >;
    return transform.call(apiClient.defaults, data, headers);
  };

  it('declares no default Content-Type', () => {
    const headers = apiClient.defaults.headers;
    expect(headers.common?.['Content-Type']).toBeUndefined();
    expect(headers.post?.['Content-Type']).toBeUndefined();
  });

  it('keeps a FormData body as multipart instead of serializing it to JSON', () => {
    const formData = new FormData();
    formData.append('file', new File(['contents'], 'purchase-request.pdf', { type: 'application/pdf' }));
    formData.append('title', 'Purchase Request');

    expect(transformRequest(formData)).toBeInstanceOf(FormData);
  });

  it('still serializes plain object bodies to JSON', () => {
    expect(transformRequest({ reason: 'Insufficient documentation' })).toBe(
      JSON.stringify({ reason: 'Insufficient documentation' })
    );
  });
});
