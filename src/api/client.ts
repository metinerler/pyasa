// Backend IP + port — update if server moves
export const BASE_URL = 'http://192.168.10.3:3000/api/v1';

let _token: string | null = null;
export const setToken = (t: string | null) => { _token = t; };

function uploadForm<T>(method: string, path: string, formData: FormData): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${BASE_URL}${path}`);

    if (_token) xhr.setRequestHeader('Authorization', `Bearer ${_token}`);

    xhr.onload = () => {
      const json = xhr.responseText ? JSON.parse(xhr.responseText) : null;

      if (xhr.status < 200 || xhr.status >= 300) {
        const msg = Array.isArray(json?.message)
          ? json.message.join(', ')
          : (json?.message ?? `HTTP ${xhr.status}`);
        reject(new Error(msg));
        return;
      }

      resolve(json as T);
    };

    xhr.onerror = () => reject(new Error('Ağ bağlantısı kurulamadı.'));
    xhr.send(formData);
  });
}

async function request<T>(
  method: string,
  path: string,
  body?: object,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(json?.message)
      ? json.message.join(', ')
      : (json?.message ?? `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return json as T;
}

export const api = {
  get:      <T>(path: string)                   => request<T>('GET',    path),
  post:     <T>(path: string, body?: object)    => request<T>('POST',   path, body),
  patch:    <T>(path: string, body: object)     => request<T>('PATCH',  path, body),
  delete:   <T>(path: string)                   => request<T>('DELETE', path),
  postForm: <T>(path: string, form: FormData)   => uploadForm<T>('POST',  path, form),
  patchForm:<T>(path: string, form: FormData)   => uploadForm<T>('PATCH', path, form),
};
