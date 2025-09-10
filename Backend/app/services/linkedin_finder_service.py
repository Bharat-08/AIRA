# Backend/app/services/linkedin_finder_service.py

import os
import requests
from typing import Optional
from supabase import Client

class LinkedInFinder:
    """
    A service class to find LinkedIn URLs for candidates, mirroring the
    logic from the original url_finder.py script.
    """
    def __init__(self):
        """
        Initializes the LinkedInFinder.
        Checks for the SerpApi key upon instantiation.
        """
        self.serpapi_key = os.getenv('SERPAPI_KEY')
        if self.serpapi_key:
            print("LinkedInFinder initialized with SerpApi key.")
        else:
            print("LinkedInFinder initialized without SerpApi key. Will use fallback search.")

    def _normalize_linkedin_url(self, url: Optional[str]) -> Optional[str]:
        """
        Cleans and standardizes a LinkedIn URL.
        """
        if not url:
            return None
        url = url.strip()
        if url.startswith('//'):
            url = 'https:' + url
        if not url.startswith('http'):
            url = 'https://' + url
        # Strip query params and trailing slash for cleanliness
        url = url.split('?')[0].rstrip('/')
        return url

    def _search_google_for_linkedin(self, candidate_name: str, current_company: str) -> str:
        """
        Fallback method from the original script. Returns "NOT_FOUND".
        """
        print(f"  Fallback search triggered for {candidate_name}. Returning NOT_FOUND.")
        return "NOT_FOUND"

    def _search_with_serpapi(self, candidate_name: str, current_company: str) -> Optional[str]:
        """
        Searches for a LinkedIn profile using the SerpApi.
        """
        search_query = f'"{candidate_name}" "{current_company}" site:linkedin.com/in'
        params = {
            'q': search_query,
            'api_key': self.serpapi_key,
            'engine': 'google',
            'num': 5
        }
        try:
            print(f"Executing SerpApi search for: {candidate_name}")
            response = requests.get('https://serpapi.com/search', params=params, timeout=15)
            response.raise_for_status()
            results = response.json()
            
            if 'organic_results' in results:
                for result in results['organic_results']:
                    link = result.get('link', '')
                    if 'linkedin.com/in/' in link or 'linkedin.com/pub/' in link:
                        normalized_url = self._normalize_linkedin_url(link)
                        print(f"Found LinkedIn URL via SerpApi: {normalized_url}")
                        return normalized_url
            
            return "NOT_FOUND"
            
        except Exception as e:
            print(f"SerpApi error: {str(e)}")
            return None

    def search_linkedin_profile(self, candidate_name: str, current_company: str) -> Optional[str]:
        """
        Main logic function that decides which search method to use.
        """
        if self.serpapi_key:
            return self._search_with_serpapi(candidate_name, current_company)
        else:
            return self._search_google_for_linkedin(candidate_name, current_company)

    def find_and_update_url(self, profile_id: str, supabase: Client) -> Optional[str]:
        """
        The main public method for this service. It fetches candidate data,
        finds the URL using the core logic, and updates the database.
        """
        try:
            profile_res = supabase.table("search").select("profile_name, company").eq("profile_id", profile_id).single().execute()

            if not profile_res.data:
                print(f"No profile found with profile_id: {profile_id}")
                return None

            profile = profile_res.data
            candidate_name = profile.get("profile_name")
            current_company = profile.get("company")
            
            if not candidate_name or not current_company:
                print(f"Candidate {profile_id} is missing name or company. Cannot search.")
                return None

            # Use the class method to perform the search
            linkedin_url = self.search_linkedin_profile(candidate_name, current_company)

            final_url = None
            if linkedin_url and linkedin_url != "NOT_FOUND":
                final_url = self._normalize_linkedin_url(linkedin_url)
                print(f"URL found for {candidate_name}: {final_url}. Updating database.")
                supabase.table("search").update({"profile_url": final_url}).eq("profile_id", profile_id).execute()
            else:
                print(f"LinkedIn URL not found for {candidate_name}.")
            
            return final_url

        except Exception as e:
            print(f"An unexpected error occurred in find_and_update_url: {e}")
            return None