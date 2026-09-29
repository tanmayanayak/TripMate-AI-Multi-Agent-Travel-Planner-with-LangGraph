from tools.tavily_tool import tavily_serach
from tools.flight_tool import search_flights

# res = tavily_serach("Best hotels in India")
# print(res)/


res = search_flights("Plan a 7 days Nepal trip from India")
print(res)


