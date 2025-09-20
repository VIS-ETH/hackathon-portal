import requests
import os

def upload_image_to_presigned_url(image_path, presigned_url):
    """
    Upload an image file to a presigned S3 URL.

    Args:
        image_path (str): Path to the image file to upload
        presigned_url (str): Presigned S3 URL for uploading

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Verify the file exists
        if not os.path.isfile(image_path):
            print(f"Error: File '{image_path}' does not exist.")
            return False

        # Open and read the image file in binary mode
        with open(image_path, 'rb') as file:
            image_data = file.read()

        # Upload to the presigned URL
        # Note: For presigned URLs, we typically don't need additional headers for authentication
        # as the authentication is embedded in the URL itself
        headers = {
            'Content-Type': 'image/jpeg',  # Adjust if using different image format
        }

        response = requests.put(presigned_url, data=image_data, headers=headers)

        # Check if upload was successful
        if response.status_code == 200:
            print(f"Successfully uploaded '{image_path}' to S3.")
            return True
        else:
            print(f"Failed to upload. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        return False

upload_image_to_presigned_url("/Users/hannes/Desktop/20Matur-7740.jpg", "http://localhost:9000/portal/b7b624ad-3166-4ae8-8a7c-9858091f03e5?x-id=PutObject&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=portal%2F20250920%2Flocal%2Fs3%2Faws4_request&X-Amz-Date=20250920T160328Z&X-Amz-Expires=900&X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost&X-Amz-Signature=a255b348bc4813956dd9faa59df6aed2a2e71db85945855fcc89606b6f766ee3")
