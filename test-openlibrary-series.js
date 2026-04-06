// Test script to demonstrate Open Library API series information
const testOpenLibrarySeries = async () => {
  try {
    // First, let's search for the book to get its key
    const searchResponse = await fetch(
      'https://openlibrary.org/search.json?q=The+Final+Empire+Brandon+Sanderson&fields=key,title,author_name,cover_i,first_publish_year,series,series_key,series_number&limit=5'
    );
    
    if (!searchResponse.ok) {
      throw new Error('Search failed');
    }

    const searchData = await searchResponse.json();
    
    console.log('Search Results:');
    console.log('===============');
    
    if (searchData.docs && searchData.docs.length > 0) {
      const firstBook = searchData.docs[0];
      console.log(`Found book: ${firstBook.title} (Key: ${firstBook.key})`);
      
      // Now get detailed information about this specific book
      console.log('\nGetting detailed book information...');
      const detailResponse = await fetch(`https://openlibrary.org${firstBook.key}.json`);
      
      if (detailResponse.ok) {
        const bookDetail = await detailResponse.json();
        console.log('\nDetailed Book Information:');
        console.log('==========================');
        console.log(`Title: ${bookDetail.title}`);
        console.log(`Authors: ${bookDetail.authors ? bookDetail.authors.map(a => a.name).join(', ') : 'Unknown'}`);
        console.log(`First Published: ${bookDetail.first_publish_date || 'Unknown'}`);
        console.log(`Series: ${bookDetail.series ? JSON.stringify(bookDetail.series, null, 2) : 'Not part of a series'}`);
        console.log(`Works: ${bookDetail.works ? bookDetail.works.length : 0} works`);
        
        // If there are works, let's check the first work for series info
        if (bookDetail.works && bookDetail.works.length > 0) {
          const workKey = bookDetail.works[0].key;
          console.log(`\nChecking work: ${workKey}`);
          
          const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
          if (workResponse.ok) {
            const workDetail = await workResponse.json();
            console.log('\nWork Information:');
            console.log('=================');
            console.log(`Title: ${workDetail.title}`);
            console.log(`Series: ${workDetail.series ? JSON.stringify(workDetail.series, null, 2) : 'Not part of a series'}`);
            console.log(`Series Keys: ${workDetail.series_key ? JSON.stringify(workDetail.series_key, null, 2) : 'None'}`);
            console.log(`Series Number: ${workDetail.series_number || 'Not specified'}`);
          }
        }
      }
    }
    
    // Let's also try searching specifically for series
    console.log('\n\nSearching for series information...');
    console.log('====================================');
    
    const seriesSearchResponse = await fetch(
      'https://openlibrary.org/search.json?q=series:"Mistborn"&fields=key,title,author_name,cover_i,first_publish_year,series,series_key,series_number&limit=10'
    );
    
    if (seriesSearchResponse.ok) {
      const seriesData = await seriesSearchResponse.json();
      console.log(`Found ${seriesData.numFound} books in Mistborn series`);
      
      if (seriesData.docs && seriesData.docs.length > 0) {
        seriesData.docs.forEach((book, index) => {
          console.log(`\nBook ${index + 1}:`);
          console.log(`Title: ${book.title}`);
          console.log(`Author: ${book.author_name ? book.author_name.join(', ') : 'Unknown'}`);
          console.log(`Year: ${book.first_publish_year || 'Unknown'}`);
          console.log(`Series: ${book.series ? book.series.join(', ') : 'Not part of a series'}`);
          console.log(`Series Keys: ${book.series_key ? book.series_key.join(', ') : 'None'}`);
          console.log(`Series Number: ${book.series_number || 'Not specified'}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error testing Open Library API:', error);
  }
};

// Run the test
testOpenLibrarySeries(); 