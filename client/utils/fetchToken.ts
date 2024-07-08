export async function fetchUserToken() {
    const res = await fetch('/api/user'); 
    const data = await res.json();
    if (res.ok) {
      return data;
    } else {
      throw new Error(data.error);
    }
  }
  